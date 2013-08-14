'use strict';

App.directive('onEnter', ['KeyboardHandler', function(KeyboardHandler)
{
    var linker = function(scope, element, attrs)
    {
        KeyboardHandler.listen(13, scope[attrs.onEnter])
    };

    return {
        restrict: 'A',
        link: linker
    }
}]);

App.directive('modal', ['$rootScope', function($rootScope)
{
    var linker = function(scope, element, attrs)
    {
        $rootScope.Modal = {
            elt: element,
            open: function(title, template, data)
            {

            }
        };

    };

    return {
        restrict: 'E',
        scope: {
            title: '@',
            template: '&',
            data: '@'
        },
        link: linker,
        template: 'views/modal.html'
    }
}]);
