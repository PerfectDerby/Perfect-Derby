import{i as m,w as p,a as y}from"./index-BvSsDQD8.js";const f=typeof window<"u"&&window.Capacitor?.isNativePlatform?.()&&window.Capacitor?.Plugins?.AdMob?window.Capacitor.Plugins.AdMob:null;function c(e,...o){if(f&&typeof f[e]=="function")return f[e](...o);const t={initialize:async()=>{},requestConsentInfo:async()=>({isConsentFormAvailable:!1,status:"NOT_REQUIRED"}),showConsentForm:async()=>{},prepareRewardVideoAd:async()=>{},showRewardVideoAd:async()=>({type:"Dismissed"}),addListener:()=>({remove:()=>{}})};return t[e]?t[e]():Promise.resolve()}const v={initialize:e=>c("initialize",e),requestConsentInfo:e=>c("requestConsentInfo",e),showConsentForm:()=>c("showConsentForm"),prepareRewardVideoAd:e=>c("prepareRewardVideoAd",e),showRewardVideoAd:()=>c("showRewardVideoAd"),addListener:(...e)=>c("addListener",...e)},A="ca-app-pub-3940256099942544/5224354917",x="ca-app-pub-3940256099942544/1712485313";let l=!1,r=null;const h={async init(){if(!l){if(!m()){console.log("[RewardService] Web platform detected. AdMob SDK not loaded (using mock mode)."),l=!0;return}try{r=v,await p(r.initialize({requestTrackingAuthorization:!0}),5e3,"AdMob initialize timed out");try{const e=await r.requestConsentInfo({});e.isConsentFormAvailable&&e.status==="REQUIRED"&&(await p(r.showConsentForm(),5e3,"Consent form timed out"),console.log("[RewardService] UMP consent form shown."))}catch(e){console.warn("[RewardService] UMP consent error (non-fatal):",e)}l=!0,console.log("[RewardService] AdMob initialized successfully.")}catch(e){console.error("[RewardService] Failed to initialize AdMob:",e),l=!0}}},async showRewardedAd(){if(l||await this.init(),!m())return R();try{const o=window.Capacitor?.getPlatform?.()==="ios"?x:A;return await p(r.prepareRewardVideoAd({adId:o,isTesting:!0}),3e3,"AdMob prepare timed out"),new Promise(async t=>{let a=!1;const d=await r.addListener("onRewardedVideoAdReward",i=>{console.log("[RewardService] Ad Reward Received:",i),a=!0}),n=await r.addListener("onRewardedVideoAdDismissed",()=>{console.log("[RewardService] Ad Dismissed. rewarded:",a),d.remove(),n.remove(),t(a)}),s=await r.addListener("onRewardedVideoAdFailedToLoad",i=>{console.warn("[RewardService] Ad Failed to Load/Show:",i),d.remove(),n.remove(),s.remove(),t(!1)});await r.showRewardVideoAd().catch(i=>{console.error("[RewardService] Show failed:",i),d.remove(),n.remove(),s.remove(),t(!1)})})}catch(e){return console.warn("[RewardService] Rewarded ad exception:",e),!1}}};function R(){return new Promise(e=>{const o=document.createElement("div");o.id="mock-ad-overlay",o.style.cssText=`
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.98);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'PressStart2PLocal', monospace, sans-serif;
            color: #fff;
            gap: 20px;
            image-rendering: pixelated;
        `,o.innerHTML=`
            <div style="font-size:10px; color:rgba(255,255,255,0.4); letter-spacing:4px; margin-bottom: 5px;">[ OFFICIAL TEST AD ]</div>
            
            <div style="position:relative; width: 320px; height: 180px; background: #000; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                
                <!-- LOADING INDICATOR -->
                <div id="mock-ad-loading" style="font-size:10px; color:#555; position:absolute; z-index:1;">LOADING VIDEO...</div>

                <video id="mock-ad-video" width="320" height="180" muted autoplay playsinline style="object-fit: cover; opacity: 0; transition: opacity 0.5s; z-index:2;">
                    <source src="https://vjs.zencdn.net/v/oceans.mp4" type="video/mp4">
                </video>
            </div>

            <div style="height: 100px; display: flex; align-items: center; justify-content: center;">
                <div id="mock-ad-timer" style="font-size:12px; color:#aaa; font-weight: bold; letter-spacing:1px;">
                    REWARD IN <span id="mock-ad-count">5</span>S
                </div>

                <button id="mock-ad-skip" style="
                    display:none;
                    background-color: #FFD700;
                    color: #000;
                    border: 3px solid #fff;
                    padding: 16px 32px;
                    font-family: 'PressStart2PLocal', cursive, sans-serif;
                    font-size: 12px;
                    cursor: pointer;
                    border-radius: 0;
                    letter-spacing: 1px;
                    box-shadow: 6px 6px 0 #000;
                    transform: translateY(0);
                    transition: transform 0.1s, box-shadow 0.1s;
                    text-transform: uppercase;
                    font-weight: bold;
                " onmousedown="this.style.transform='translate(3px, 3px)'; this.style.boxShadow='3px 3px 0 #000'" 
                  onmouseup="this.style.transform='translate(0)'; this.style.boxShadow='6px 6px 0 #000'">
                    ${y?"(A) ":""}COLLECT REWARD
                </button>
            </div>
        `,document.body.appendChild(o);const t=o.querySelector("#mock-ad-video"),a=o.querySelector("#mock-ad-loading"),d=o.querySelector("#mock-ad-count"),n=o.querySelector("#mock-ad-skip"),s=o.querySelector("#mock-ad-timer");t.onplaying=()=>{t.style.opacity="1",a&&(a.style.display="none")},t.onerror=()=>{console.warn("[RewardService] Video failed to load. Falling back to timer-only mock."),a&&(a.textContent="VIDEO UNAVAILABLE")},t.play().catch(u=>{console.log("[RewardService] Autoplay blocked or failed:",u)});let i=5;const w=()=>{i>0&&(i--,d&&(d.textContent=i)),i<=0?(s&&(s.style.display="none"),n&&(n.style.display="block")):setTimeout(w,1e3)};w(),t.onended=()=>{i=0,s&&(s.style.display="none"),n&&(n.style.display="block")},n.addEventListener("click",()=>{o.remove(),e(!0)})})}export{h as rewardService};
