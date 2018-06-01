import axios from 'axios';
import qs from 'qs'
import config from '../config';
import * as _ from 'lodash';

//FIXME axios全局默认设置
//超时时间
axios.defaults.timeout = 1000 * 15;
//请求拦截器
axios.interceptors.request.use(
    config => {
        if (config.method === "post") {
            config.data = qs.stringify(config.data);
            config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        return config;
    }
);

//FIXME Service服务类封装
/**
 * @class
 */
class Service {
    request(url, params) {
        return new RequestPromise(url, params || {});
    }

    get(url, params) {
        return new RequestPromise(url, {...{ data:params||{}}, ...{method: 'get'}});
    }

    post(url, params) {
        return new RequestPromise(url, {...{ data:params||{}},  ...{method: 'post'}});
    }

    url(url, type) {
        switch (type) {
            default:
                return config.url(url);
        }
    }
}

//FIXME 异步request请求封装类,目的是符合async习惯但简化前端必须catch的操作
class RequestPromise {
    //构造函数声明
    constructor(url, params) {
        //FIXME then和catch只处理数据成功和失败,
        //then函数处理回调
        this.thenHandler = null;
        //catch函数处理回调
        this.catchHandler = null;
        //FIXME serverError处理服务器请求失败回调
        this.serverErrorHandler = null;
        //FIXMEaxios请求参数
        this.requestOpts = {
            method: 'post',
        };
        this.init(url, params);
    }

    init(url, params) {
        //FIXME axios请求
        axios(_.merge(this.requestOpts, params, {
            url: config.url(url)
        })).then(response => {
            const data = response.data;
            switch (data.code) {
                //数据返回code为0时成功处理
                case '0':
                    if (this.thenHandler) {
                        this.thenHandler({
                            full: data,
                            data: data.data,
                        })
                    } else {
                        console.log({
                            full: data,
                            data: data.data
                        })
                    }
                    break;
                //数据返回code为不为0时失败处理
                default:
                    if (this.catchHandler) {
                        this.catchHandler({
                            full: data,
                            data: data.data,
                        })
                    } else {
                        console.log({
                            full: data,
                            data: data.data
                        })
                    }
                    break;
            }
        }).catch(err => {
            //服务器请求问题时处理
            if (this.serverErrorHandler) {
                this.serverErrorHandler(err)
            } else {
                console.log(err);
            }
        })
    }
    then(func) {
        this.thenHandler = func;
        return this;
    }
    catch(func) {
        this.catchHandler = func;
        return this;
    }
    serverError(func) {
        this.serverErrorHandler = func;
        return this;
    }
}
export default Service;
