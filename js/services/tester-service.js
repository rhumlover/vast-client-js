App.service('TesterService', function($rootScope)
{
    function TesterService()
    {
        this.list = [];
        this._data = {};
    }

    TesterService.prototype.timeoutDuration = 2000;

    TesterService.prototype.addTest = function(label, fn)
    {
        var self = this;

        this.list.push(new Test({
            label: label,
            fn: fn,
            root: self
        }));

        return this;
    };
    TesterService.prototype.init = function(data)
    {
        angular.extend(this, data);
        return this;
    };
    TesterService.prototype.reset = function()
    {
        var test;

        this._data.length = 0;
        for (var i = 0, len = this.list.length; i < len; i++)
        {
            test = this.list[i];
            test.reset();
        }
        return this;
    };
    TesterService.prototype.set = function(key, value)
    {
        this._data[key] = value;
        return this;
    };
    TesterService.prototype.get = function(key)
    {
        return this._data[key];
    };
    TesterService.prototype.has = function(key)
    {
        return this._data.hasOwnProperty(key);
    };
    TesterService.prototype.run = function()
    {
        var runNext, currentTest, index, res, doneFn, failFn, timeout,
            self = this;

        index = 0;

        runNext = function()
        {
            currentTest = self.list[index];
            if (!currentTest) return;

            console.log('Running `'+ currentTest.label +'`');
            currentTest.started = true;

            if (currentTest.fn.length >= 1)
            {
                timeout = setTimeout(failFn, self.timeoutDuration);
                currentTest.fn.call(currentTest, doneFn, failFn);
            }
            else
            {
                res = currentTest.fn.call(currentTest);
                res ? doneFn() : failFn();
            }
        }

        failFn = function(err)
        {
            if (timeout) clearTimeout(timeout);

            console.log('   > fail');
            currentTest.success = false;

            self.$scope && self.$scope.$apply();
        }

        doneFn = function()
        {
            if (timeout) clearTimeout(timeout);

            console.log('   > success');
            currentTest.success = true;
            index++;
            runNext();

            self.$scope && self.$scope.$apply();
        };

        runNext();
    };

    TesterService.prototype.Error = function(label, data)
    {
        this.label = label;
        this.data = data;
        this.stack = null;
    }

    function Modal(data)
    {
        var defaults = {
            link: '+',
            title: '',
            template: null,
            data: null
        };
        angular.extend(this, defaults, data);
    }
    Modal.prototype.open = function()
    {
        if (!this.template) return;

        var modalFn;

        if (modalFn = $rootScope.Modal)
        {
           modalFn.open(this.title, this.template, this.data);
        }
    };

    TesterService.prototype.Modal = Modal;

    // ------------------------------------------------------
    // TestVO
    // ------------------------------------------------------
    function Test(data)
    {
        this.reset();
        angular.extend(this, data);
    }
    Test.prototype.reset = function()
    {
        angular.extend(this, {
            started: false,
            success: null,
            error: null,
            data: null,
            modal: null
        });
    };
    Test.prototype.get = function(key)
    {
        return this._data[key];
    };
    Test.prototype.set = function(key, value)
    {
        this._data[key] = value;
    };
    Test.prototype.has = function(key)
    {
        return this._data.hasOwnProperty(key);
    };


    // ------------------------------------------------------
    // Finally
    // ------------------------------------------------------
    return new TesterService();
});
