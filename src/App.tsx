import React from 'react';
import './css/App.css';
import axios from 'axios';
import { signin, signup } from './simple';

// firebase functions
const instance = axios.create({
  baseURL: 'https://asia-northeast1-awesome-fr0ntend.cloudfunctions.net/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  proxy: false,
  responseType: 'json',
});

// local server
// const instance = axios.create({
//   baseURL: 'http://localhost:4000',
//   timeout: 15000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   proxy: false,
//   responseType: 'json',
// });

function App() {
  const isProduction = process.env.NODE_ENV === 'production';
  const clientId = isProduction ? 'awesome-fr0ntend.web.app' : 'localhost';

  return (
    <div className="App">
      <button onClick={signup(instance, clientId)}>signup</button>
      <button onClick={signin(instance)}>signin</button>
    </div>
  );
}

export default App;
