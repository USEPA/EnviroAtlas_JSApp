//>>built
define(["require","exports"],function(l,c){function m(a,b,e){for(var d=a.length,f=0;f<d;f++)if(b.call(e,a[f],f,a))return f;return-1}function h(a,b,e,d){void 0===e&&(e=a.length);d=d||r;for(var f=Math.max(0,d.last-10),g=-1,c=f;c<e;++c)if(a[c]===b){g=c;break}if(-1===g){for(c=0;c<f;++c)if(a[c]===b){g=c;break}if(-1===g)return}return a[g]=a[e-1],a.pop(),d.last=g,b}function n(a,b,e,d){void 0===e&&(e=a.length);var f=[];return b.forEach(function(b){void 0!==h(a,b,e,d)&&(f.push(b),--e)}),f}function p(a,b){return-1===
a.indexOf(b)}function q(a,b,e){return!a.some(b.bind(null,e))}function t(a){return a}Object.defineProperty(c,"__esModule",{value:!0});c.findIndex=m;c.find=function(a,b,e){for(var d=a.length,f=0;f<d;f++){var c=a[f];if(b.call(e,c,f,a))return c}};c.unique=function(a){return a.filter(function(a,e,d){return d.indexOf(a)===e})};c.equals=function(a,b,e){if(!a&&!b)return!0;if(!a||!b||a.length!==b.length)return!1;if(e)for(var d=0;d<a.length;d++){if(!e(a[d],b[d]))return!1}else for(d=0;d<a.length;d++)if(a[d]!==
b[d])return!1;return!0};c.difference=function(a,b,e){var d,f;return e?(d=b.filter(q.bind(null,a,e)),f=a.filter(q.bind(null,b,e))):(d=b.filter(p.bind(null,a)),f=a.filter(p.bind(null,b))),{added:d,removed:f}};c.intersect=function(a,b,e){return a&&b?e?a.filter(function(a){return-1<m(b,function(b){return e(a,b)})}):a.filter(function(a){return-1<b.indexOf(a)}):[]};c.constant=function(a,b){for(var e=Array(a),d=0;d<a;d++)e[d]=b;return e};c.range=function(a,b){void 0===b&&(b=a,a=0);for(var e=Array(b-a),d=
a;d<b;d++)e[d-a]=d;return e};c.binaryIndexOf=function(a,b,e){for(var d=a.length,c=0,g=d-1;c<g;){var h=c+Math.floor((g-c)/2);b>a[h]?c=h+1:g=h}g=a[c];return e?b>=a[d-1]?-1:g===b?c:c-1:g===b?c:-1};var k=function(){return function(){this.last=0}}();c.RemoveHint=k;var r=new k;l=function(){return function(a){var b=this;this._array=a;this._hint=new k;this.remove=function(a){return h(b._array,a,b._array.length,b._hint)};this.removeMany=function(a){return n(b._array,a,b._array.length,b._hint)}}}();c.UnorderedRemover=
l;c.removeUnordered=h;c.removeUnorderedMany=n;c.keysOfMap=function(a){var b=[];return a.forEach(function(a,d){return b.push(d)}),b};c.keysOfSet=function(a,b){void 0===b&&(b=t);var c=[];return a.forEach(function(a){return c.push(b(a))}),c}});