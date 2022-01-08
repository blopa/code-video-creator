module.exports = {
    presets: [
        ['@babel/preset-react', {
            targets: { node: 'current' },
        }],
        ["@babel/preset-env", {
            "modules": "commonjs"
        }]
    ],
    plugins: ['@babel/plugin-syntax-jsx'],
};
