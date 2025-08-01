module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: process.env.NODE_ENV === 'production' 
    ? ['transform-remove-console'] 
    : [],
};
