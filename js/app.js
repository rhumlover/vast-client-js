'use strict';

// Declare app level module which depends on filters, and services
var App = angular.module('App', []);

App.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/test', { templateUrl: 'views/test.html', controller: 'TestCtrl' })
        .when('/mocha', { templateUrl: 'views/mocha.html', controller: 'MochaCtrl' })
        .otherwise({ redirectTo: '/test' });
}]);
