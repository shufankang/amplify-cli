const AmplifyHosting = require('../../../amplify-hosting/index');

async function enable(context) {
  AmplifyHosting.add(context);
}

async function configure(context) {
  AmplifyHosting.configure(context);
}

function publish(context) {
  AmplifyHosting.publish(context);
}

function console(context) {
  AmplifyHosting.console(context);
}


module.exports = {
  enable,
  configure,
  publish,
  console,
};
