const path = (props, obj) => {
  let nested = obj;
  const properties = typeof props === 'string' ? props.split('.') : props;

  for (let i = 0; i < properties.length; i++) {
    nested = nested[properties[i]];
    if (nested === undefined) {
      return nested;
    }
  }

  return nested;
};

module.exports = {
  path,
};
