import { MongoClient } from 'mongodb';

const uri = 'mongodb://root:example@localhost:27017';
export const dbName = 'webauthn';

const connectOptions = {
  useUnifiedTopology: true,
};

const client = new MongoClient(uri, connectOptions);
export default client;
