'use strict';

App.service('PlayerService', ['LogService', function(Log)
{
    var Player = (function()
    {
        var videoElt, baseElt;

        videoElt = baseElt = document.getElementById('player');

        var errorCallback = function(e, clientCallback)
        {
            var videoSrc = this.currentSrc,
                errorObj,
                messageResponse;

            if (videoSrc == this.baseURI || !videoSrc.length) return;

            messageResponse =
            {
                message: '',
                hint: 'Media URL: <input type="text" class="form-control" value="' + videoSrc + '"/>'
            };

            errorObj = e.target.error;

            switch (errorObj.code)
            {
                case errorObj.MEDIA_ERR_ABORTED:
                    messageResponse.message = 'Video playback aborted';
                    break;

                case errorObj.MEDIA_ERR_NETWORK:
                    messageResponse.message = 'A network error caused the video download to fail part-way';
                    break;

                case errorObj.MEDIA_ERR_DECODE:
                    messageResponse.message = 'The video playback was aborted due to a corruption problem or because the video used features your browser did not support';
                    break;

                case errorObj.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    messageResponse.message = 'The video could not be loaded, either because the server or network failed or because the format is not supported';
                    break;

                default:
                    messageResponse.message = 'An unknown error occurred';
                    break;
            }

            clientCallback.call(clientCallback, e, messageResponse);
        };

        return {
            $elt: videoElt,
            load: function(url)
            {
                url = jQuery.trim(url);
                if (url.length)
                {
                    videoElt.src = url;
                    videoElt.load();
                }
            },
            reset: function()
            {
                $(videoElt).replaceWith(baseElt.cloneNode());
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
                if (event === 'error')
                {
                    videoElt.addEventListener('error', function(e)
                    {
                        errorCallback.call(videoElt, e, callback);
                    });
                }
                else
                {
                    videoElt.addEventListener(event, callback);
                }
            }
        }
    })();

    return Player;
}]);


App.service('LogService', ['$rootScope', function($rootScope)
{
    var Log = (function()
    {
        var Entry = function(label, template)
            {
                this.label = label;
                this.template = template;
                this.reset();
            },
            entries = [
                ['VALID_URL', 'Valid URL'],
                ['VALID_XML', 'Valid XML response', 'views/modal-xml-source.html'],
                ['VAST_RESPONSE', 'Valid VAST response'],
                ['VAST_AD', 'Valid VAST ad', 'views/modal-ad-details.html'],
                ['CAN_PLAY_AD', 'Can play mediaFile'],
            ],
            logs = [];

        Entry.prototype.reset = function()
        {
            this.started = false;
            this.success = null;
            this.error = null;
            this.data = null;
        };
        Entry.prototype.openModal = function(type)
        {
            var label, template, data, modalFn;

            switch (type)
            {
                case 'error':
                    label = this.error.message;
                    template = 'views/modal-error.html';
                    data = this.error;
                    break;

                case 'details':
                    label = this.label;
                    template = this.template;
                    data = this.data;
                    break;
            }

            if (template)
            {
                if (modalFn = $rootScope.Modal)
                {
                   modalFn.open(label, template, data);
                }
            }
        };

        for (var i = 0, len = entries.length; i < len; i++)
        {
            var entry = entries[i],
                code = entry[0],
                label = entry[1],
                template = entry[2];

            logs.push(new Entry(label, template));
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
            },
            setData: function(key, data)
            {
                var entry = this.getEntry(key);
                entry.data = data;
            }
        }
    })();

    return Log;
}]);


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