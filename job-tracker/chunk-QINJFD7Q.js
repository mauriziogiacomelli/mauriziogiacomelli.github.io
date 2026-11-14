var e="bWF1cml6aW9naWFjb21lbGxp",r="Z21haWwuY29t";function c(o){return`${atob(e)}${o?`+${o}`:""}@${atob(r)}`}var a="am9idHJhY2tldA==";function d(o){return`${atob(a)}${o?`+${o}`:""}@${atob(r)}`}function s(o,t,n=""){let i=n?`&body=${encodeURIComponent(n)}`:"";return`mailto:${c(o)}?subject=${encodeURIComponent(t)}${i}`}var u="Richiesta prova gratuita Job Tracker",p=`Ciao Maurizio,
vorrei provare Job Tracker.
User\xF2 per l'accesso l'indirizzo da cui ti scrivo.

Nome:
Ruolo che cerco:
`;function b(){document.location.href=s("jobtracker",u,p)}export{c as a,d as b,b as c};
