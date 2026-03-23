import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { db, auth as firebaseAuth, storage } from './config/firebase';
import { verifyToken, AuthRequest } from './middleware/auth';
import { asyncHandler, AppError, globalErrorHandler } from './utils/errors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Upload media
 */
app.post('/media/upload', verifyToken, upload.single('file'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const { groupId } = req.body;
  if (!groupId) {
    throw new AppError('Group ID is required', 400);
  }

  const user = req.user!;
  const bucket = storage.bucket();
  const fileName = `groups/${groupId}/${Date.now()}-${req.file.originalname}`;
  const file = bucket.file(fileName);

  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  stream.on('error', (err: any) => {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload to storage' });
  });

  stream.on('finish', async () => {
    try {
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // Far future
      });
      res.status(200).json({ url });
    } catch (error) {
      console.error('Make public error:', error);
      res.status(500).json({ error: 'Failed to finalize upload' });
    }
  });

  stream.end(req.file.buffer);
}));

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'WhatsApp Backend running' });
});

/**
 * Exchange AuthHub token for Firebase Custom Token
 */
app.get('/auth/firebase-token', verifyToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const user = req.user!;
  
  try {
    await db.collection('users').doc(user.uid).set({
      name: user.name || 'Unknown',
      email: user.email || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const customToken = await firebaseAuth.createCustomToken(user.uid, {
      email: user.email,
      name: user.name
    });
    res.status(200).json({ customToken });
  } catch (error) {
    console.error('Error creating Firebase custom token:', error);
    throw new AppError('Failed to generate real-time access token', 500);
  }
}));

/**
 * Search for users (Contact Discovery)
 */
app.get('/users/search', verifyToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { query } = req.query;
  
  if (!query || typeof query !== 'string') {
    throw new AppError('Search query is required', 400);
  }

  try {
    const usersSnapshot = await db.collection('users')
      .where('name', '>=', query)
      .where('name', '<=', query + '\uf8ff')
      .limit(20)
      .get();
    
    const users = usersSnapshot.docs.map((doc: any) => ({
      uid: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json(users.filter((u: any) => u.uid !== req.user!.uid));
  } catch (error) {
    res.status(200).json([]);
  }
}));

/**
 * Save FCM Token
 */
// Update FCM Token with Zod validation
const fcmTokenSchema = z.object({
  token: z.string().min(1, "FCM token is required")
});

app.post('/users/me/fcm-token', verifyToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const parseResult = fcmTokenSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(parseResult.error.issues[0].message, 400);
  }
  const { token } = parseResult.data;
  const user = req.user!;

  await db.collection('users').doc(user.uid).set({
    fcmTokens: admin.firestore.FieldValue.arrayUnion(token)
  }, { merge: true });

  res.status(200).json({ success: true });
}));

/**
 * Get my groups
 */
app.get('/groups/my', verifyToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const user = req.user!;
  const groupsToReturn: any[] = [];
  
  const membersSnapshot = await db.collectionGroup('members')
    .where('uid', '==', user.uid)
    .get();

  for (const doc of membersSnapshot.docs) {
    const groupRef = doc.ref.parent.parent;
    if (groupRef) {
      const groupDoc = await groupRef.get();
      if (groupDoc.exists) {
        groupsToReturn.push({ id: groupDoc.id, ...groupDoc.data() });
      }
    }
  }

  res.status(200).json(groupsToReturn);
}));

/**
 * Create a new direct 1v1 chat
 */
app.post('/chats/direct', verifyToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { recipientUid, recipientName } = req.body;
  const user = req.user!;

  if (!recipientUid) {
    throw new AppError('Recipient UID is required', 400);
  }

  // Check if a direct chat already exists
  const existingChat = await db.collection('groups')
    .where('type', '==', 'direct')
    .where('participantUids', 'array-contains', user.uid)
    .get();

  const found = existingChat.docs.find((doc: any) => {
    const data = doc.data();
    return data.participantUids.includes(recipientUid);
  });

  if (found) {
    return res.status(200).json({ id: found.id });
  }

  // Create new direct chat
  const newChatRef = db.collection('groups').doc();
  const chatId = newChatRef.id;

  await newChatRef.set({
    name: `Chat with ${recipientName}`,
    type: 'direct',
    participantUids: [user.uid, recipientUid],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastMessage: {
      text: 'Direct message started',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  });

  // Add initial system message
  await newChatRef.collection('messages').add({
    text: `Chat started with ${recipientName}`,
    type: 'system',
    senderId: 'system',
    visibleTo: ['ALL'],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Add members
  for (const uid of [user.uid, recipientUid]) {
    await newChatRef.collection('members').doc(uid).set({
        uid,
        joinedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  res.status(201).json({ id: chatId });
}));

/**
 * Create a new group
 */
app.post('/groups', verifyToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { name, members } = req.body;
  const user = req.user!;

  if (!name) {
    throw new AppError('Group name is required', 400);
  }

  const groupRef = db.collection('groups').doc();
  const groupId = groupRef.id;

  // Ensure owner is in members
  const memberList = members || [];
  if (!memberList.includes(user.uid)) {
    memberList.push(user.uid);
  }

  await groupRef.set({
    name,
    type: 'group',
    ownerId: user.uid,
    members: memberList,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastMessage: {
      text: 'Group created',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  });

  // Add initial system message
  await groupRef.collection('messages').add({
    text: `${user.name} created the group "${name}"`,
    type: 'system',
    senderId: 'system',
    visibleTo: ['ALL'],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Add members
  for (const memberUid of memberList) {
    await groupRef.collection('members').doc(memberUid).set({
      uid: memberUid,
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  res.status(201).json({ id: groupId });
}));

/**
 * Send a message to a group
 */
app.post('/groups/:groupId/messages', verifyToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { groupId } = req.params;
  const { text, visibleTo, type, mediaUrl, replyTo } = req.body;
  const user = req.user!;

  if (!text && !mediaUrl) {
    throw new AppError('Message text or media is required', 400);
  }

  const groupRef = db.collection('groups').doc(groupId);
  const groupDoc = await groupRef.get();

  if (!groupDoc.exists) {
    throw new AppError('Group not found', 404);
  }

  const groupData = groupDoc.data()!;
  
  // Verify membership via subcollection
  const memberDoc = await groupRef.collection('members').doc(user.uid).get();
  
  if (!memberDoc.exists) {
    throw new AppError('You are not a member of this group', 403);
  }

  const messageData = {
    text: text || '',
    type: type || 'text',
    mediaUrl: mediaUrl || null,
    replyTo: replyTo || null,
    senderId: user.uid,
    senderName: user.name,
    visibleTo: visibleTo || ['ALL'],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  const messageRef = await groupRef.collection('messages').add(messageData);

  // Update last message in group
  await groupRef.update({
    lastMessage: {
      text: type === 'image' ? '📷 Image' : text,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  });

  // Send Push Notifications
  try {
    const membersSnapshot = await groupRef.collection('members').get();
    const notificationPromises: Promise<any>[] = [];

    for (const memberDoc of membersSnapshot.docs) {
      const memberUid = memberDoc.id;
      
      // Skip sender
      if (memberUid === user.uid) continue;
      
      // Respect selective visibility
      if (!visibleTo.includes('ALL') && !visibleTo.includes(memberUid)) continue;

      // Get member's FCM tokens
      const userDoc = await db.collection('users').doc(memberUid).get();
      if (!userDoc.exists) continue;
      
      const fcmTokens = userDoc.data()?.fcmTokens;
      if (fcmTokens && Array.isArray(fcmTokens) && fcmTokens.length > 0) {
        const payload = {
          notification: {
            title: groupData.type === 'direct' ? user.name : `${user.name} in ${groupData.name}`,
            body: type === 'image' ? '📷 Image' : text,
          },
          data: {
            groupId,
            type
          }
        };

        const messageOptions = {
          tokens: fcmTokens,
          ...payload
        };

        notificationPromises.push(admin.messaging().sendMulticast(messageOptions));
      }
    }

    await Promise.all(notificationPromises);
  } catch (err: any) {
    console.error('Push notification error:', err);
    // Silent fail for push
  }

  res.status(201).json({ id: messageRef.id, ...messageData });
}));

/**
 * Get group members
 */
app.get('/groups/:groupId/members', verifyToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { groupId } = req.params;
  const user = req.user!;

  const groupRef = db.collection('groups').doc(groupId);
  const groupDoc = await groupRef.get();

  if (!groupDoc.exists) {
    throw new AppError('Group not found', 404);
  }

  const groupData = groupDoc.data()!;
  
  const membersSnapshot = await groupRef.collection('members').get();
  const members = membersSnapshot.docs.map((doc: any) => doc.id);
  
  if (!members.includes(user.uid)) {
    throw new AppError('You are not a member of this group', 403);
  }

  const memberDetails = await Promise.all(members.map(async (uid: string) => {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
        return { uid, name: userDoc.data()?.name || 'Unknown User' };
    }
    return { uid, name: uid === user.uid ? user.name : 'Group Member' };
  }));

  res.status(200).json(memberDetails);
}));

/**
 * React to a message
 */
app.post('/groups/:groupId/messages/:messageId/react', verifyToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { groupId, messageId } = req.params;
  const { emoji } = req.body;
  const user = req.user!;

  if (!emoji) {
    throw new AppError('Emoji is required', 400);
  }

  const groupRef = db.collection('groups').doc(groupId);
  const memberDoc = await groupRef.collection('members').doc(user.uid).get();
  
  if (!memberDoc.exists) {
    throw new AppError('You are not a member of this group', 403);
  }
  
  await groupRef.collection('messages').doc(messageId).collection('reactions').doc(user.uid).set({
    emoji,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.status(200).json({ success: true });
}));

/**
 * Public Key for E2E Encryption
 */
app.post('/users/me/public-key', verifyToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { publicKey } = req.body;
  const user = req.user!;

  if (!publicKey) {
    throw new AppError('Public key is required', 400);
  }

  await db.collection('users').doc(user.uid).set({
    publicKey,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  res.status(200).json({ success: true });
}));

/**
 * Initiate Call (Signaling)
 */
app.post('/calls', verifyToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { recipientUid, type } = req.body; // type: 'voice' | 'video'
  const user = req.user!;

  if (!recipientUid || !type) {
    throw new AppError('Recipient UID and call type are required', 400);
  }

  const callRef = db.collection('calls').doc();
  await callRef.set({
    callerId: user.uid,
    callerName: user.name,
    recipientId: recipientUid,
    type,
    status: 'ringing',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.status(201).json({ id: callRef.id });
}));

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
