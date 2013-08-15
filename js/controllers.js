'use strict';

App.controller('TestCtrl', ['$rootScope', '$scope', '$http', 'LogService', 'PlayerService', function($rootScope, $scope, $http, Log, Player)
{
    // Scope properties
    $scope.vastUrl = 'http://localhost/vast-client-js/test/staticparser-bad.xml';
    $scope.currentAd = null;
    $scope.currentSource = null;
    $scope.logs = Log.list;
    $scope.wantedFormat = 'video/mp4';

    $scope.Modal = $rootScope.Modal;

    $scope.goClickHandler = function()
    {
        var vastUrl;

        Log.reset();
        Player.reset();

        if (vastUrl = $scope.vastUrl)
        {
            Log.start('VALID_URL');

            var onParseError = function(e)
            {
                Log.setError('VALID_XML', { message: 'XML document doesn\'t seems to be wellformed' });
                $scope.$apply();
            }
            var onRequestFail = function(e)
            {
                var message = e.statusText + ' (' + e.status + ')',
                    hint = '';

                switch (e.statusText)
                {
                    case 'error':
                        var _navigator;
                        if ((_navigator = window.navigator) && !_navigator.onLine)
                        {
                            hint = 'Check your internet connection, you appears to be offline.';
                        }
                        else
                        {
                            hint = 'The VAST response seems to not support CORS server-side (Access-Control-Allow-Origin). Check your JavaScript console or network traces for more details';
                        }
                        break;

                    case 'Not Found':
                        hint = 'Check your URL'
                        break;
                }

                Log.setError('VALID_URL', { message: message, hint: hint });
                // Log.setError('VALID_XML', { message: 'Unable to fetch XML source' });
                $scope.$apply();
            }
            var onRequestSuccess = function(e)
            {
                Log.setSuccess('VALID_XML');
                Log.setData('VALID_XML', e.responseText);
                parseVast(vastUrl);
                $scope.currentSource = e.responseText;
                $scope.$apply();
            }

            $.get(vastUrl).always(function(res, status, evt)
            {
                // console.log(arguments);
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

                    case 'error':
                        // In this case, res == evt
                        onRequestFail.call(null, res);
                    default:
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

    // Stuff
    var parseVast = function(vastUrl)
    {
        Log.start('VAST_RESPONSE');

        DMVAST.client.get(vastUrl, function(err, response)
        {
            var vastTracker;

            if (err)
            {
                Log.setError('VAST_RESPONSE', err);
                return $scope.$apply();
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
                            if (mediaFile.mimeType != $scope.wantedFormat) continue;

                            vastTracker = new DMVAST.tracker(ad, linearCreative);
                            vastTracker.on('clickthrough', function(url)
                            {
                                document.location.href = url;
                            });
                            // Player.on('canplay', function() {vastTracker.load();});
                            // Player.on('timeupdate', function() {vastTracker.setProgress(this.currentTime);});
                            // Player.on('play', function() {vastTracker.setPaused(false);});
                            // Player.on('pause', function() {vastTracker.setPaused(true);});

                            Log.setData('VAST_AD', ad);
                            $scope.currentAd = ad;

                            Player.on('playing', function()
                            {
                                Log.setSuccess('CAN_PLAY_AD');
                                $scope.$apply();
                            })

                            Player.on('error', function(e, err)
                            {
                                Log.setError('CAN_PLAY_AD', err);
                                $scope.$apply();
                            });

                            Player.load(mediaFile.fileURL);
                            Player.play();
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
    };
}]);