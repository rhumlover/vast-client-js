'use strict';

// Declare app level module which depends on filters, and services
var App = angular.module('App', []);

App.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/test', { templateUrl: 'views/test.html', controller: 'TestCtrl' });
    $routeProvider.otherwise({redirectTo: '/test'});
}]);
