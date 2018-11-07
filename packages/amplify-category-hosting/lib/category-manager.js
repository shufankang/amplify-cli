const path = require('path');
const constants = require('./constants');
const supportedServices = require('./supported-services');

function getAvailableServices() {
  const availableServices = [];
  Object.keys(supportedServices).forEach(service => availableServices.push(service));
  return availableServices;
}

function getCategoryStatus(context) {
  const enabledServices = [];
  const disabledServices = [];

  const availableServices = getAvailableServices(context);
  if (availableServices.length > 0) {
    const { hosting } = context.amplify.getProjectMeta();
    if (hosting) {
      Object.keys(hosting).forEach(key => enabledServices.push(key));
    }
    availableServices.forEach((service) => {
      if (!enabledServices.includes(service)) {
        disabledServices.push(service);
      }
    });
  }

  return {
    availableServices,
    enabledServices,
    disabledServices,
  };
}

function runServiceAction(context, service, action, args) {
  context.exeInfo = context.amplify.getProjectDetails();
  if (context.exeInfo.amplifyMeta) {
    context.exeInfo.categoryMeta = context.exeInfo.amplifyMeta[constants.CategoryName];
    if (context.exeInfo.categoryMeta) {
      context.exeInfo.serviceMeta = context.exeInfo.categoryMeta[service];
    }
  }
  const serviceModule = require(path.join(__dirname, `${service}/index.js`));
  return serviceModule[action](context, args);
}

module.exports = {
  getCategoryStatus,
  runServiceAction,
};
