const inquirer = require('inquirer');
const Ora = require('ora');
const sequential = require('promise-sequential');
const categoryManager = require('./lib/category-manager');
const supportedServices = require('./lib/supported-services');

async function add(context) {
  const {
    availableServices,
    enabledServices,
    disabledServices,
  } = categoryManager.getCategoryStatus(context);

  if (availableServices.length > 0) {
    if (enabledServices.length !== availableServices.length) {
      const choices = disabledServices.map(service => ({
        name: supportedServices[service].name,
        value: service,
      }));
      enabledServices.forEach((service) => {
        new Ora().succeed(supportedServices[service].name);
      });
      const answers = await inquirer.prompt({
        type: 'list',
        name: 'selectedService',
        message: 'Please select the service to add.',
        choices,
        default: disabledServices[0],
      });
      const tasks = [];
      tasks.push(() => categoryManager.runServiceAction(context, answers.selectedService, 'enable'));

      return sequential(tasks);
    }
    const errorMessage = 'Hosting is already fully enabled.';
    context.print.error(errorMessage);
  } else {
    const errorMessage = 'Hosting is not available from enabled providers.';
    context.print.error(errorMessage);
  }
}

async function configure(context) {
  const {
    availableServices,
    enabledServices,
  } = categoryManager.getCategoryStatus(context);

  if (availableServices.length > 0) {
    if (enabledServices.length > 1) {
      const choices = enabledServices.map(service => ({
        name: supportedServices[service].name,
        value: service,
      }));
      const answers = await inquirer.prompt({
        type: 'list',
        name: 'selectedService',
        message: 'Please select the service to configure.',
        choices,
        default: enabledServices[0],
      });
      const tasks = [];
      tasks.push(() => categoryManager.runServiceAction(context, answers.selectedService, 'configure'));

      return sequential(tasks);
    } else if (enabledServices.length === 1) {
      return categoryManager.runServiceAction(context, enabledServices[0], 'configure');
    }
    throw new Error('No hosting service is enabled.');
  } else {
    throw new Error('Hosting is not available from enabled providers.');
  }
}

function publish(context, service, args) {
  const {
    enabledServices,
  } = categoryManager.getCategoryStatus(context);

  if (enabledServices.length > 0) {
    if (enabledServices.includes(service)) {
      return categoryManager.runServiceAction(context, service, 'publish', args);
    }
    throw new Error(`Hosting service ${service} is NOT enabled.`);
  } else {
    throw new Error('No hosting service is enabled.');
  }
}

async function console(context) {
  const {
    availableServices,
    enabledServices,
  } = categoryManager.getCategoryStatus(context);

  if (availableServices.length > 0) {
    if (enabledServices.length > 1) {
      const choices = enabledServices.map(service => ({
        name: supportedServices[service].name,
        value: service,
      }));
      const answer = await inquirer.prompt({
        type: 'list',
        name: 'selectedService',
        message: 'Please select the service.',
        choices,
        default: enabledServices[0],
      });
      return categoryManager.runServiceAction(context, answer.selectedService, 'console');
    } else if (enabledServices.length === 1) {
      return categoryManager.runServiceAction(context, enabledServices[0], 'console');
    }
    throw new Error('No hosting service is enabled.');
  } else {
    throw new Error('Hosting is not available from enabled providers.');
  }
}

module.exports = {
  add,
  configure,
  publish,
  console,
};
