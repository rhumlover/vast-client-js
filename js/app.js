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
    var Player = (function()
    {
        var videoElt = document.getElementById('player');

        return {
            $elt: videoElt,
            load: function(url)
            {
                videoElt.src = jQuery.trim(url);
                videoElt.load();
            },
            reset: function()
            {
                videoElt.src = '';
            },
            play: function()
            {
                videoElt.play();
            },
            pause: function()
            {
                videoElt.pause();
            },
            get: function(property)
            {
                return videoElt[property];
            },
            on: function(event, callback)
            {
                videoElt.addEventListener(event, callback);
            }
        }
    })();

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
                ['VALID_XML', 'Valid XML response'],
                ['VAST_RESPONSE', 'Valid VAST response'],
                ['VAST_AD', 'Valid VAST ad'],
            ],
            logs = [];

        Entry.prototype.reset = function()
        {
            this.started = false;
            this.success = null;
            this.error = null;
        };

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
            reset: function()
            {
                var entry;

                for (var i = 0, len = logs.length; i < len; i++)
                {
                    entry = logs[i];
                    entry.reset();
                }
            },
            start: function(key)
            {
                var entry = this.getEntry(key);
                entry.started = true;
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

                $scope.$parent.currentError = error;
            }
        }
    })();

    var parseVast = function(vastUrl)
    {
        Log.start('VAST_RESPONSE');

        DMVAST.client.get(vastUrl, function(err, response)
        {
            var vastTracker;

            if (err)
            {
                Log.setError('VAST_RESPONSE', err);
                $scope.$apply();
                return;
            }

            if (response)
            {
                Log.setSuccess('VAST_RESPONSE');
                Log.start('VAST_AD');

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

                            vastTracker = new DMVAST.tracker(ad, linearCreative);
                            vastTracker.on('clickthrough', function(url)
                            {
                                document.location.href = url;
                            });
                            Player.on('canplay', function() {vastTracker.load();});
                            Player.on('timeupdate', function() {vastTracker.setProgress(this.currentTime);});
                            Player.on('play', function() {vastTracker.setPaused(false);});
                            Player.on('pause', function() {vastTracker.setPaused(true);});

                            Player.load(mediaFile.fileURL);
                            Player.play();
                            // put $player in ad mode
                            break;
                        }

                        if (vastTracker)
                        {
                            break;
                        }
                    }

                    if (vastTracker)
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

            if (!vastTracker)
            {
                Log.setError('VAST_AD');
                // No pre-roll, start video
            }
            else
            {
                Log.setSuccess('VAST_AD');
            }

            $scope.$apply();
        });
    }

    $scope.logs = Log.list;

    $scope.goClickHandler = function()
    {
        var vastUrl;

        Log.reset();
        Player.reset();

        if (vastUrl = $scope.vastUrl)
        {
            Log.start('VALID_URL');
            Log.start('VALID_XML');

            var onParseError = function(e)
            {
                Log.setError('VALID_XML', { message: 'XML document doesn\'t seems to be wellformed' });
                $scope.$apply();
            }
            var onRequestFail = function(e)
            {
                var message = e.statusText + ' (' + e.status + ')';
                Log.setError('VALID_URL', { message: message });
                Log.setError('VALID_XML', { message: '---' });
                $scope.$apply();
            }
            var onRequestSuccess = function(e)
            {
                Log.setSuccess('VALID_XML');
                parseVast(vastUrl);
                $scope.$apply();
            }

            $.get(vastUrl).always(function(res, status, evt)
            {
                switch (status)
                {
                    case 'success':
                        Log.setSuccess('VALID_URL');
                        onRequestSuccess.call(null, evt);
                        break;

                    case 'parsererror':
                        Log.setSuccess('VALID_URL');
                        onParseError.call(null, evt);
                        break;

                    default:
                        onParseError.call(null, evt);
                }
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
