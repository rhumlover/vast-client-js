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

                case 'stack':
                    label = this.error.message;
                    template = 'views/modal-stack.html';
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
