module.exports = {
  template(
    { template },
    opts,
    { imports, componentName, props, jsx, exports },
  ) {
    const typeScriptTemplate = template.smart({ plugins: ['typescript'] })
    return typeScriptTemplate.ast`
    import * as React from 'react';
    const ${componentName} = (props: React.SVGProps<SVGSVGElement>) => ${jsx};
    export default ${componentName};
  `
  },
}
