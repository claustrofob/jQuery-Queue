/**
 * Callbacks queue
 * 
 * Creates a queue of callback functions and executes them one by one
 * 
 * Callback function should return a jQuery deferred object otherwise it is resolved immediately
 * and next callback is called
 * 
 * If callback with the existing id is pushed it returns the deferred object of the existing callback
 * 
 * Usage:
 * var q = new Queue();
 * q.push('ajax_request', function(){
 *      return $.post();
 * });
 * 
 * @author Nikolay Zmachinsky
 */

function Queue(){
    
    var isRunning = false;
    
    /**
     * lock/unlock the queue
     */
    var locked = false;
    
    /**
     * array of callbacks
     */
    var queue = [];
    
    function process(){
        if (!queue.length || isRunning) return;
        isRunning = true;

        var qEl = queue.shift();
        $.when(qEl.callback.apply(qEl.context)).done(function(){
            qEl.def.resolve.apply(null, arguments);
        }).fail(function(){
            qEl.def.reject.apply(null, arguments);
        }).always(function(){
            isRunning = false;
            process();
        });
    };
    

    /**
     * Push new callback into the queue
     * 
     * @param id - unique id of the callback
     * @param callback
     * @param thisArg - context object of the callback
     * @returns $.Deferred
     */
    this.push = function(id, callback, thisArg){
        var def = $.Deferred();
        var existedEl = false;
        
        if (locked){
            def.reject();
        } else if (existedEl = this.get(id)){
            def = existedEl.def;
        } else {
            var qPush = {'id': id, 'callback': callback, 'context': thisArg, 'def': def};
            queue.push(qPush);
            process();
        }
        
        return def.promise();
    };

    this.get = function(id){
        for (var i in queue) {
            var qEl = queue[i];
            if (qEl.id === id){
                return qEl;
            }
        }
        
        return false;
    };
    
    /**
     * locks the queue for any further callback
     */
    this.lock = function(){
        locked = true;
    };
    
    /**
     * unlocks the queue
     */
    this.unlock = function(){
        locked = false;
    };
    
    this.size = function(){
        return queue.length;
    };
};