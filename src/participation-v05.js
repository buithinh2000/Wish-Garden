/* Wish Garden AWS-only migration stage: deliberately no remote consent collection.
 * The existing local-only ceremony remains the functioning opt-in precursor.
 * No Cloudflare widgets, tokens or external requests in the staging preview.
 */
(function(){
'use strict';
const root=document.getElementById('ceremony');
if(!root)return;
const section=document.createElement('section');
section.id='hopeParticipation';
section.style.cssText='margin-top:18px;padding:18px;border:1px solid #baa8806b;border-radius:16px;background:#17283d;color:#f9ebd2';
const heading=document.createElement('h3');
heading.style.cssText='font:normal 24px Georgia,serif;margin:0 0 10px';
const info=document.createElement('p');
const checkbox=document.createElement('input');
checkbox.type='checkbox';
const label=document.createElement('label');label.append(checkbox);
label.style.cssText='display:block;margin:12px 0;font-size:14px';
const button=document.createElement('button');
button.type='button';button.disabled=true;
button.style.cssText='padding:10px 14px;border-radius:10px;background:#d7c29a;color:#203047;font:inherit';
const feedback=document.createElement('p');feedback.setAttribute('role','status');
feedback.style.cssText='font-size:13px;color:#d9dccf';
section.append(heading,info,label,button,feedback);root.append(section);
function paint(){
 const vi=document.documentElement.lang==='vi';
 heading.textContent=vi?'Tham gia thông điệp chung':'Contribute to the shared message';
 info.textContent=vi
  ?'Hành trình riêng vẫn hoạt động trên thiết bị. Ghi nhận tập thể trên AWS chưa mở; chỉ sau kiểm thử và thông báo quyền riêng tư mới tiếp nhận đăng ký thật.'
  :'Your private journey still works locally. AWS global registration is not active yet. Actual registrations require independent testing and a privacy notice.';
 label.querySelector('span')?.remove();
 const span=document.createElement('span');
 span.textContent=vi?' Tôi muốn được thông báo khi đăng ký mở (chưa có chức năng gửi thông báo).':' I am interested when registration opens (notifications are not available).';
 label.append(span);
 button.textContent=vi?'Đăng ký tập thể chưa mở':'Global registration unavailable';
 feedback.textContent=vi?'Chưa gửi dữ liệu lên AWS.':'Global registration is not active yet. No data has been uploaded to AWS.';
}
document.getElementById('lang')?.addEventListener('click',()=>queueMicrotask(paint));
paint();
})();