import router from './router';
import { nextTick } from 'vue';
import { permissionStore, dictStore, userStore, configStore } from './store';
import defaultDict from './store/modules/defaultDict';
import { getToken, changeLocation, removeToken } from 'cyber-web-ui';

const modules = import.meta.glob(['./views/**/*.vue', '!./views/**/modules/*.vue']);

const whiteList = ['/login'];

router.beforeEach(async (to, from, next) => {
  if(!configStore().isAcquire) {
    await configStore().getProductConfig();
  }
  if(getToken()) {
    let isReplace = false;
    if(!permissionStore().isAcquire) {
      try {
        await userStore().getInfo();
        let routes = await permissionStore().generateRoutes(modules, router, 'Layout');
        if(routes.some(route => route.path == to.path)) {
          delete to.params?.catchAll;
          delete to.name;
        }
        isReplace = true;
      } catch(error) {
        removeToken();
        let path = getReplacePath(configStore().loginPath)
        if(!path) return next(false);
        next(path);
        return;
      }
    }
    let path = '';
    if(/\/login|^\/$/.test(to.path)) {
      path = getReplacePath(configStore().homePath);
      if(!path) return next(false);
    }
    if(path) next({ path, replace: true });
    else if(isReplace) next({ ...to, replace: true });
    else next();
   } else {
    if(whiteList.indexOf(to.path) !== -1) {
      next();
    } else if(configStore().loginPath) {
      let path = getReplacePath(configStore().loginPath)
      if(!path) return next(false);
      next(path);
    } else {
      next('/login');
    }
  }
});

function getReplacePath(replacePath) {
  let path = location.origin + location.pathname + (location.hash ? '#' : '');
  if(!replacePath.includes(path)) return changeLocation(replacePath);
  return replacePath.replace(path, '');
}

nextTick(async () => {
  // 初始化本地字典
  const $dictStore = dictStore();
  Object.keys((defaultDict || {})).forEach(key => {
    $dictStore.update(key, defaultDict[key], { label: 'label', value: 'value' });
  });
})