//>>built
define(["require","exports"],function(h,k){var g=function(){return function(){}}();return function(){function f(a,b,c,d,e){void 0===d&&(d=1);void 0===e&&(e=0);this.classConstructor=a;this.acquireFunctionOrWithConstructor=b;this.releaseFunction=c;this.growthSize=d;!0===b?this.acquireFunction=this._constructorAcquireFunction:"function"==typeof b&&(this.acquireFunction=b);this._pool=Array(e);this._set=new Set;this._initialSize=e;for(a=0;a<e;a++)this._pool[a]=new this.classConstructor;this.growthSize=
Math.max(d,1)}return f.prototype.acquire=function(){for(var a=[],b=0;b<arguments.length;b++)a[b]=arguments[b];var c,b=this.classConstructor||g;if(0===this._pool.length)for(var d=this.growthSize,e=0;e<d;e++)this._pool[e]=new b;return c=this._pool.shift(),this.acquireFunction?this.acquireFunction.apply(this,[c].concat(a)):c&&c.acquire&&"function"==typeof c.acquire&&c.acquire.apply(c,a),this._set.delete(c),c},f.prototype.release=function(a){a&&!this._set.has(a)&&(this.releaseFunction?this.releaseFunction(a):
a&&a.release&&"function"==typeof a.release&&a.release(),this._pool.push(a),this._set.add(a))},f.prototype.prune=function(a){if(void 0===a&&(a=this._initialSize),!(this._pool.length<=a))for(var b;a>this._pool.length;)b=this._pool.shift(),this._set.delete(b),b.dispose&&"function"==typeof b.dispose&&b.dispose()},f.prototype._constructorAcquireFunction=function(a){for(var b=[],c=1;c<arguments.length;c++)b[c-1]=arguments[c];(d=this.classConstructor).call.apply(d,[a].concat(b));var d},f}()});