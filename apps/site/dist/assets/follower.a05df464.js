(function(){"use strict";self.onconnect=function(n){const e=new MessageChannel;var o=n.ports[0];console.log("follower connected"),o.onmessage=function(t){const{port:s,id:c}=t.data;e.port2.onmessage=function(a){const r=new TextDecoder().decode(a.data);o.postMessage(r)},s.postMessage({id:c,port:e.port1},[e.port1])}}})();
