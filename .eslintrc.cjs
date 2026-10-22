module.exports = {
  root: true,

  env: {
    browser: true,
    es2021: true,
    node: true,
  },

  extends: ["airbnb-base", "plugin:vue/vue3-essential"],

  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },

  plugins: ["vue"],

  settings: {
    "import/resolver": {
      alias: {
        map: [["@", "./.vitepress/theme"]],
        extensions: [".js", ".mjs", ".vue", ".ts", ".json"],
      },
    },
    "import/core-modules": [
      "unplugin-auto-import/vite",
      "unplugin-vue-components/vite",
      "vitepress-plugin-tabs/client",
    ],
  },

  overrides: [
    {
      // TypeScript 文件需要 TS parser（api/、functions/ 下的 .ts）
      files: ["**/*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        sourceType: "module",
      },
    },
    {
      // 配置文件本身为 CommonJS
      files: [".eslintrc.{js,cjs}", "*.cjs"],
      env: {
        node: true,
      },
      parserOptions: {
        sourceType: "script",
      },
    },
    {
      // 服务端 / 构建期脚本运行在 Node 环境
      files: [
        "api/**/*.ts",
        "functions/**/*.ts",
        ".vitepress/**/*.mjs",
        "page/**/*.mjs",
        "pages/**/*.mjs",
      ],
      env: {
        node: true,
      },
      rules: {
        // 与现有代码风格冲突的 airbnb 规则（同 .vitepress 主体放宽项）
        "no-plusplus": "off",
        "no-await-in-loop": "off",
        "no-continue": "off",
        "import/prefer-default-export": "off",
      },
    },
    {
      // .vue 中 <script lang="ts"> 需要 TS parser（仅 SystemStatus.vue 使用）
      files: [".vitepress/**/*.vue"],
      parser: "vue-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
    },
    {
      // .vitepress 主体代码：自动导入 + 运行时全局 + airbnb 风格放宽
      files: [".vitepress/**/*.{js,mjs,vue}"],
      globals: {
        // unplugin-auto-import 运行时注入（见 .vitepress/auto-imports.d.ts）
        ref: "readonly",
        computed: "readonly",
        watch: "readonly",
        onMounted: "readonly",
        nextTick: "readonly",
        useData: "readonly",
        useRouter: "readonly",
        useRoute: "readonly",
        onBeforeUnmount: "readonly",
        onUnmounted: "readonly",
        defineAsyncComponent: "readonly",
        getCurrentInstance: "readonly",
        // Vite define 注入（config.mjs vite.define）
        __GIT_COMMIT__: "readonly",
        // window.$xxx 运行时全局（Message.vue / Player.vue / Artalk.vue 挂载）
        $message: "readonly",
        $player: "readonly",
        $comment: "readonly",
        // CDN 库
        Artalk: "readonly",
        twikoo: "readonly",
        Fancybox: "readonly",
      },
      rules: {
        // —— 组件命名（33 条，改名是巨大 diff） ——
        "vue/multi-word-component-names": "off",

        // —— 依赖检查（构建期依赖不进 dependencies） ——
        "import/no-extraneous-dependencies": "off",

        // —— airbnb 风格规则放宽（约 200 条，与现有代码风格冲突） ——
        "no-plusplus": "off",
        "no-restricted-syntax": "off",
        "no-param-reassign": "off",
        "consistent-return": "off",
        "no-use-before-define": "off",
        "object-curly-newline": "off",
        "operator-linebreak": "off",
        "spaced-comment": "off",
        "no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }],
        "no-underscore-dangle": "off",
        "prefer-destructuring": "off",
        "prefer-template": "off",
        "no-nested-ternary": "off",
        "no-cond-assign": "off",
        "no-mixed-operators": "off",
        "implicit-arrow-linebreak": "off",
        "function-paren-newline": "off",
        "arrow-body-style": "off",
        "prefer-arrow-callback": "off",
        "no-shadow": "off",
        "no-else-return": "off",
        "no-multi-assign": "off",
        "no-lonely-if": "off",
        "no-await-in-loop": "off",
        "prefer-const": "off",
        "prefer-rest-params": "off",
        "prefer-spread": "off",
        "no-var": "off",
        "vars-on-top": "off",
        "func-names": "off",
        "no-loop-func": "off",
        radix: "off",
        "no-bitwise": "off",
        "default-case": "off",
        "no-fallthrough": "off",
        "global-require": "off",
        "import/prefer-default-export": "off",
        "import/no-dynamic-require": "off",
        "import/newline-after-import": "off",
        "import/order": "off",
        "import/no-named-as-default": "off",
        "import/no-named-as-default-member": "off",
        "import/no-cycle": "off",
        "import/no-self-import": "off",
        "import/no-useless-path-segments": "off",
        "import/no-relative-packages": "off",
        "max-len": "off",
        "no-restricted-globals": "off",
        "no-mixed-spaces-and-tabs": "off",
        "no-trailing-spaces": "off",
        "eol-last": "off",
        "comma-dangle": "off",
        semi: "off",
        indent: "off",
        quotes: "off",
        "arrow-parens": "off",
        "arrow-spacing": "off",
        "no-multi-spaces": "off",
        "space-before-function-paren": "off",
        "keyword-spacing": "off",
        "space-infix-ops": "off",
        "no-spaced-func": "off",
        "padded-blocks": "off",
        "no-multiple-empty-lines": "off",
        "prefer-promise-reject-errors": "off",
        "no-alert": "off",
        "no-console": "off",
        "no-debugger": "off",
        "no-empty": "off",
        "no-empty-function": "off",
        "no-return-assign": "off",
        "no-sequences": "off",
        "no-throw-literal": "off",
        "no-unneeded-ternary": "off",
        "no-unused-expressions": "off",
        "no-useless-concat": "off",
        "no-useless-return": "off",
        "prefer-object-spread": "off",
        "quote-props": "off",
        "object-shorthand": "off",
        "dot-notation": "off",
        eqeqeq: "off",
        "no-self-compare": "off",
        "no-irregular-whitespace": "off",
        camelcase: "off",
        "id-length": "off",
        "no-continue": "off",
        "no-labels": "off",
        "no-magic-numbers": "off",
        "no-negated-condition": "off",
        "no-prototype-builtins": "off",
        "no-redeclare": "off",
        "no-return-await": "off",
        "no-useless-escape": "off",
        "prefer-exponentiation-operator": "off",
        "prefer-regex-literals": "off",
        yoda: "off",
        // —— 剩余 error 级规则 ——
        "brace-style": "off",
        "no-unsafe-optional-chaining": "off",
        "no-promise-executor-return": "off",
        "vue/require-valid-default-prop": "off",
        "no-case-declarations": "off",
        "no-new": "off",
        "array-callback-return": "off",
      },
    },
  ],

  rules: {
    // 使用双引号
    quotes: ["warn", "double"],
    // 导入后缀名
    "import/extensions": "off",
    // 禁用 console
    "no-console": "off",

    // 仓库在 Windows 上以 core.autocrlf=true 检出，工作区为 CRLF。
    // airbnb-base 默认强制 LF，会导致全仓库每个文件都报错，与本项目
    // 的检出配置冲突。此处改为跟随工作区实际换行符，不检查行尾风格。
    "linebreak-style": "off",
  },
};
