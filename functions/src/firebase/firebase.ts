import firebase from 'firebase-admin';
import { firebaseConfig } from './firebaseConfig';

export default firebase.initializeApp(firebaseConfig);
