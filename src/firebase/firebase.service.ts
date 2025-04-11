import * as admin from 'firebase-admin';
import { Injectable } from '@nestjs/common';
// import * as serviceAccount from './firebase-service-account.json';
const serviceAccount = require('../../config/firebase-service-account.json');

@Injectable()
export class FirebaseService {
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });
    }
  }

  async sendNotification(orderId:number , deviceToken: string, title: string, body: string) {
    const message = {
      notification: {
        title,
        body,
      },
      token: deviceToken,
      orderId: orderId
    };

    return admin.messaging().send(message);
  }
}
