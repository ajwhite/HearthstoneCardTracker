import Promise from 'bluebird';
import Cards from 'hearthstone-log-adapter/src/cards';

const BASE_URI = 'https://hearthstats.net/api/v3';
const AUTH_STORAGE_KEY = 'deckmanager:token'
var authToken = localStorage.getItem(AUTH_STORAGE_KEY);
var deckCache = {};
var cardCache = {};

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
  .then(response => response.data)
  .then(decks => {
    // prepopulate the cache
    decks.forEach(deck => getDeck(deck.id));
    return decks;
  });
}

function getCard (id) {
  if (cardCache[id]) {
    return new Promise((resolve, reject) => {
      resolve(cardCache[id]);
    });
  }
  return fetch(BASE_URI + '/cards/' + id + '?auth_token=' + authToken)
  .then(response => response.json())
  .then(response => response.data)
  .then(card => {
    cardCache[card.id] = card;
    return Cards.getById(card.blizz_id);
  });
}

function getDeck(id) {
  if (deckCache[id]) {
    return new Promise((resolve, reject) => {
      resolve(deckCache[id]);
    });
  }
  return fetch(BASE_URI + '/decks/' + id + '/?auth_token=' + authToken)
  .then(response => response.json())
  .then(response => response.data)
  .then(deck => {
    var promises = deck.cardstring.split(',').map(cardString => {
      var [cardId, quantity] = cardString.split('_');
      return getCard(cardId).then(card => {
        var cards = [];
        while (quantity > 0) {
          cards.push(Object.assign({}, card));
          quantity--;
        }
        return cards;
      });
    });
    return Promise.all(promises).then(cards => {
      cards = cards.reduce((flat, subset) => {
        return flat.concat(subset);
      }, []);
      deck.cards = cards;
      deckCache[deck.id] = deck;
      return deck;
    });
  });
}

function isLoggedIn () {
  return !!authToken;
}

var service = {
  login: login,
  getDecks: getDecks,
  isLoggedIn: isLoggedIn,
  authToken: authToken,
  getDeck: getDeck
};

export default service;

// export default {login, getDecks, isLoggedIn};
