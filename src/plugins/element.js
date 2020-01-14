import Vue from 'vue'
// eslint-disable-next-line no-unused-vars,import/no-duplicates
import { Button, Form, FormItem, Input } from 'element-ui' // 按需导入
// eslint-disable-next-line import/no-duplicates
import { Message } from 'element-ui'
Vue.use(Button)
Vue.use(Form)
Vue.use(FormItem)
Vue.use(Input)
// 全局挂载
Vue.prototype.$message = Message
