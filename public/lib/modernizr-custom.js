/*! modernizr 3.1.0 (Custom Build) | MIT *
 * http://modernizr.com/download/?-csstransforms-csstransforms3d-preserve3d !*/
!function(e,n,t){function r(e,n){return typeof e===n}function s(){var e,n,t,s,o,i,a;for(var f in C)if(C.hasOwnProperty(f)){if(e=[],n=C[f],n.name&&(e.push(n.name.toLowerCase()),n.options&&n.options.aliases&&n.options.aliases.length))for(t=0;t<n.options.aliases.length;t++)e.push(n.options.aliases[t].toLowerCase());for(s=r(n.fn,"function")?n.fn():n.fn,o=0;o<e.length;o++)i=e[o],a=i.split("."),1===a.length?Modernizr[a[0]]=s:(!Modernizr[a[0]]||Modernizr[a[0]]instanceof Boolean||(Modernizr[a[0]]=new Boolean(Modernizr[a[0]])),Modernizr[a[0]][a[1]]=s),y.push((s?"":"no-")+a.join("-"))}}function o(e){var n=w.className,t=Modernizr._config.classPrefix||"";if(x&&(n=n.baseVal),Modernizr._config.enableJSClass){var r=new RegExp("(^|\\s)"+t+"no-js(\\s|$)");n=n.replace(r,"$1"+t+"js$2")}Modernizr._config.enableClasses&&(n+=" "+t+e.join(" "+t),x?w.className.baseVal=n:w.className=n)}function i(){return"function"!=typeof n.createElement?n.createElement(arguments[0]):x?n.createElementNS.call(n,"http://www.w3.org/2000/svg",arguments[0]):n.createElement.apply(n,arguments)}function a(){var e=n.body;return e||(e=i(x?"svg":"body"),e.fake=!0),e}function f(e,t,r,s){var o,f,l,u,p="modernizr",d=i("div"),c=a();if(parseInt(r,10))for(;r--;)l=i("div"),l.id=s?s[r]:p+(r+1),d.appendChild(l);return o=i("style"),o.type="text/css",o.id="s"+p,(c.fake?c:d).appendChild(o),c.appendChild(d),o.styleSheet?o.styleSheet.cssText=e:o.appendChild(n.createTextNode(e)),d.id=p,c.fake&&(c.style.background="",c.style.overflow="hidden",u=w.style.overflow,w.style.overflow="hidden",w.appendChild(c)),f=t(d,e),c.fake?(c.parentNode.removeChild(c),w.style.overflow=u,w.offsetHeight):d.parentNode.removeChild(d),!!f}function l(e,n){return!!~(""+e).indexOf(n)}function u(e){return e.replace(/([a-z])-([a-z])/g,function(e,n,t){return n+t.toUpperCase()}).replace(/^-/,"")}function p(e,n){return function(){return e.apply(n,arguments)}}function d(e,n,t){var s;for(var o in e)if(e[o]in n)return t===!1?e[o]:(s=n[e[o]],r(s,"function")?p(s,t||n):s);return!1}function c(e){return e.replace(/([A-Z])/g,function(e,n){return"-"+n.toLowerCase()}).replace(/^ms-/,"-ms-")}function m(n,r){var s=n.length;if("CSS"in e&&"supports"in e.CSS){for(;s--;)if(e.CSS.supports(c(n[s]),r))return!0;return!1}if("CSSSupportsRule"in e){for(var o=[];s--;)o.push("("+c(n[s])+":"+r+")");return o=o.join(" or "),f("@supports ("+o+") { #modernizr { position: absolute; } }",function(e){return"absolute"==getComputedStyle(e,null).position})}return t}function v(e,n,s,o){function a(){p&&(delete k.style,delete k.modElem)}if(o=r(o,"undefined")?!1:o,!r(s,"undefined")){var f=m(e,s);if(!r(f,"undefined"))return f}for(var p,d,c,v,h,g=["modernizr","tspan"];!k.style;)p=!0,k.modElem=i(g.shift()),k.style=k.modElem.style;for(c=e.length,d=0;c>d;d++)if(v=e[d],h=k.style[v],l(v,"-")&&(v=u(v)),k.style[v]!==t){if(o||r(s,"undefined"))return a(),"pfx"==n?v:!0;try{k.style[v]=s}catch(y){}if(k.style[v]!=h)return a(),"pfx"==n?v:!0}return a(),!1}function h(e,n,t,s,o){var i=e.charAt(0).toUpperCase()+e.slice(1),a=(e+" "+z.join(i+" ")+i).split(" ");return r(n,"string")||r(n,"undefined")?v(a,n,s,o):(a=(e+" "+E.join(i+" ")+i).split(" "),d(a,n,t))}function g(e,n,r){return h(e,t,t,n,r)}var y=[],C=[],S={_version:"3.1.0",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(e,n){var t=this;setTimeout(function(){n(t[e])},0)},addTest:function(e,n,t){C.push({name:e,fn:n,options:t})},addAsyncTest:function(e){C.push({name:null,fn:e})}},Modernizr=function(){};Modernizr.prototype=S,Modernizr=new Modernizr;var w=n.documentElement,x="svg"===w.nodeName.toLowerCase(),_="CSS"in e&&"supports"in e.CSS,b="supportsCSS"in e;Modernizr.addTest("supports",_||b);var P=S.testStyles=f,T="Moz O ms Webkit",z=S._config.usePrefixes?T.split(" "):[];S._cssomPrefixes=z;var E=S._config.usePrefixes?T.toLowerCase().split(" "):[];S._domPrefixes=E;var N={elem:i("modernizr")};Modernizr._q.push(function(){delete N.elem});var k={style:N.elem.style};Modernizr._q.unshift(function(){delete k.style}),S.testAllProps=h,S.testAllProps=g,Modernizr.addTest("csstransforms",function(){return-1===navigator.userAgent.indexOf("Android 2.")&&g("transform","scale(1)",!0)}),Modernizr.addTest("csstransforms3d",function(){var e=!!g("perspective","1px",!0),n=Modernizr._config.usePrefixes;if(e&&(!n||"webkitPerspective"in w.style)){var t;Modernizr.supports?t="@supports (perspective: 1px)":(t="@media (transform-3d)",n&&(t+=",(-webkit-transform-3d)")),t+="{#modernizr{left:9px;position:absolute;height:5px;margin:0;padding:0;border:0}}",P(t,function(n){e=9===n.offsetLeft&&5===n.offsetHeight})}return e}),Modernizr.addTest("preserve3d",g("transformStyle","preserve-3d")),s(),o(y),delete S.addTest,delete S.addAsyncTest;for(var A=0;A<Modernizr._q.length;A++)Modernizr._q[A]();e.Modernizr=Modernizr}(window,document);