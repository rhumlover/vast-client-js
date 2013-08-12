'use strict';

// Declare app level module which depends on filters, and services
var App = angular.module('App', []);

App.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/test', { templateUrl: 'views/test.html', controller: 'TestCtrl' });
    $routeProvider.otherwise({redirectTo: '/test'});
}]);


//------------------------------------
// CONTROLLERS
//------------------------------------
App.controller('TestCtrl', ['$scope', '$http', function($scope, $http)
{
    var Log = (function()
    {
        var Entry = function(label)
            {
                this.label = label;
                this.started = false;
                this.success = null;
                this.error = null;
            },
            entries = [
                ['VALID_URL', 'Valid URL'],
                ['VALID_SCHEME', 'Valid VAST structure'],
                ['VAST_RESPONSE', 'Valid VAST response'],
                ['VAST_AD', 'Valid VAST ad'],
            ],
            logs = [];

        for (var i = 0, len = entries.length; i < len; i++)
        {
            var entry = entries[i],
                code = entry[0],
                label = entry[1];

            logs.push(new Entry(label));
            logs[code] = i;
        }

        return {
            list: logs,
            getEntry: function(key)
            {
                return logs[logs[key]];
            },
            reset: function(key, returnEntry)
            {
                var entry = this.getEntry(key);
                entry.started = false;
                entry.success = null;
                entry.error = null;
                return returnEntry ? entry : this;
            },
            start: function(key)
            {
                this.reset(key, true).started = true;
                return this;
            },
            setSuccess: function(key)
            {
                var entry = this.getEntry(key);
                entry.success = true;
                return this;
            },
            setFail: function(key)
            {
                var entry = this.getEntry(key);
                entry.success = false;
                return this;
            },
            setError: function(key, error)
            {
                var entry = this.getEntry(key);
                entry.success = false;
                entry.error = error;
            }
        }
    })();

    var parseVast = function(vastUrl)
    {
        DMVAST.client.get(vastUrl, function(response)
        {
            if (response)
            {
                for (var adIdx = 0, adLen = response.ads.length; adIdx < adLen; adIdx++)
                {
                    var ad = response.ads[adIdx];
                    for (var creaIdx = 0, creaLen = ad.creatives.length; creaIdx < creaLen; creaIdx++)
                    {
                        var linearCreative = ad.creatives[creaIdx];
                        if (linearCreative.type != "linear") continue;

                        for (var mfIdx = 0, mfLen = linearCreative.mediaFiles.length; mfIdx < mfLen; mfIdx++)
                        {
                            var mediaFile = linearCreative.mediaFiles[mfIdx];
                            if (mediaFile.mimeType != "video/mp4") continue;

                            player.vastTracker = new DMVAST.tracker(ad, linearCreative);
                            player.vastTracker.on('clickthrough', function(url)
                            {
                                document.location.href = url;
                            });
                            player.on('canplay', function() {this.vastTracker.load();});
                            player.on('timeupdate', function() {this.vastTracker.setProgress(this.currentTime);});
                            player.on('play', function() {this.vastTracker.setPaused(false);});
                            player.on('pause', function() {this.vastTracker.setPaused(true);});

                            player.video.href = mediaFile.fileURL;
                            // put player in ad mode
                            break;
                        }

                        if (player.vastTracker)
                        {
                            break;
                        }
                    }

                    if (player.vastTracker)
                    {
                        break;
                    }
                    else
                    {
                        // Inform ad server we can't find suitable media file for this ad
                        DMVAST.util.track(ad.errorURLTemplates, {ERRORCODE: 403});
                    }
                }
            }

            if (!player.vastTracker)
            {
                // No pre-roll, start video
            }

        });
    }

    $scope.logs = Log.list;

    $scope.goClickHandler = function()
    {
        var vastUrl;

        if (vastUrl = $scope.vastUrl)
        {
            Log.start('VALID_URL');

            $.get(vastUrl)
                .done(function()
                {
                    Log.setSuccess('VALID_URL');
                    $scope.$apply();
                })
                .fail(function(e)
                {
                    Log.setError('VALID_URL', { status: e.status, message: e.statusText});
                    $scope.$apply();
                });
            /*
            Angular way, but problems with `Access-Control-Allow-Headers "X-Requested-With"`
            ---------------------------------

            $http.get(vastUrl)
                .success(function()
                {
                    Log.setSuccess('VALID_URL');
                })
                .error(function(e)
                {
                    var status = e.status,
                        statusText = e.statusText;

                    Log.setFail('VALID_URL');
                })
            */
        }
    };
}]);

//------------------------------------
// DIRECTIVES
//------------------------------------
App.directive('onEnter', ['KeyboardHandler', function(KeyboardHandler)
{
    var linker = function(scope, element, attrs)
    {
        KeyboardHandler.listen(13, scope.onEnter)
    }
    return {
        restrict: 'A',
        scope: {
            onEnter: '&'
        },
        link: linker
    }
}]);

//------------------------------------
// SERVICES
//------------------------------------
App.service('KeyboardHandler', [function()
{
    var handler = (function(){

        var clients = {};

        document.addEventListener('keyup', function(e)
        {
            var keyCode = e.keyCode,
                fns = clients[keyCode];

            if (angular.isArray(fns) && fns.length)
            {
                for (var i = 0, len = fns.length; i < len; i++)
                {
                    var fn = fns[i];
                    fn.call(fn);
                }
            }
        });

        return {
            listen: function(keyCode, fn)
            {
                var register = clients[keyCode] || (clients[keyCode] = []);
                register.push(fn);
            }
        }

    }());

    return handler;
}]);
