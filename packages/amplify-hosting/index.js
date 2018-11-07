const AmplifyDeploy = require('./lib/AWSAmplifyHosting');

async function add(context) {
  AmplifyDeploy.add(context);
}

async function configure(context) {
  AmplifyDeploy.configure(context);
}

function publish(context) {
  AmplifyDeploy.publish(context);
}

function console(context) {
  AmplifyDeploy.console(context);
}

module.exports = {
  add,
  configure,
  publish,
  console,
};
