// random character id
// function makeid(length) {
//   var result = '';
//   var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   var charactersLength = characters.length;
//   for (var i = 0; i < length; i++) {
//     result += characters.charAt(Math.floor(Math.random() *
//       charactersLength));
//   }
//   return result;
// }

const toSpotify = {
  client_id: 'e968b2a38dd44043b74b91126fce5126',
  response_type: 'token',
  redirect_uri: 'https://nodespotify.herokuapp.com/redirect.html',
  scope: ['user-read-private', 'user-read-email', 'user-top-read'].join(' ')
};

const uri = new URL("https://accounts.spotify.com/authorize?" +
  "client_id=" + toSpotify.client_id +
  "&response_type=" + toSpotify.response_type +
  "&redirect_uri=" + toSpotify.redirect_uri +
  "&scope=" + toSpotify.scope +
  "&show_dialog=true");


$(document).ready(function () {
  $('button').click(function () {
    window.location.href = uri;
  })
});