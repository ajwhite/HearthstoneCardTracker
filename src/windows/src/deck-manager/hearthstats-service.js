import Promise from 'bluebird';

const BASE_URI = 'https://hearthstats.net/api/v3';
const AUTH_STORAGE_KEY = 'deckmanager:token'
var authToken = localStorage.getItem(AUTH_STORAGE_KEY);

function login (email, password) {
  return fetch(BASE_URI + '/users/sign_in', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      user_login: {
        email: email,
        password: password
      }
    })
  })
  .then(response => response.json())
  .then(response => {
    authToken = response.auth_token;
    localStorage.setItem(AUTH_STORAGE_KEY, authToken);
    return authToken;
  });
}

function getDecks () {
  return fetch(BASE_URI + '/decks?auth_token=' + authToken)
  .then(response => response.json())
  .then(response => response.data);
}

function isLoggedIn () {
  return !!authToken;
}

var service = {
  login: login,
  getDecks: getDecks,
  isLoggedIn: isLoggedIn,
  authToken: authToken
};

export default service;

// export default {login, getDecks, isLoggedIn};
