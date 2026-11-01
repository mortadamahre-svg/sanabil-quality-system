'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const javaRoot = path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'sanabil', 'flourdistribution');
const main = path.join(javaRoot, 'MainActivity.java');
if (!fs.existsSync(main)) throw new Error('Capacitor MainActivity.java not found: ' + main);
fs.mkdirSync(javaRoot, { recursive: true });
const pluginSource = path.join(root, 'android-native', 'SanabilDownloadsPlugin.java');
if (!fs.existsSync(pluginSource)) throw new Error('Sanabil Downloads plugin source is missing');
fs.copyFileSync(pluginSource, path.join(javaRoot, 'SanabilDownloadsPlugin.java'));
let source = fs.readFileSync(main, 'utf8');
if (!source.includes('import android.os.Bundle;')) source = source.replace(/(package [^;]+;\s*)/, '$1\nimport android.os.Bundle;\n');
if (!source.includes('import com.sanabil.flourdistribution.SanabilDownloadsPlugin;')) source = source.replace(/(package [^;]+;\s*)/, '$1\nimport com.sanabil.flourdistribution.SanabilDownloadsPlugin;\n');
if (!source.includes('registerPlugin(SanabilDownloadsPlugin.class)')) {
  source = source.replace(/public class MainActivity extends BridgeActivity\s*\{/, 'public class MainActivity extends BridgeActivity {\n    @Override\n    public void onCreate(Bundle savedInstanceState) {\n        registerPlugin(SanabilDownloadsPlugin.class);\n        super.onCreate(savedInstanceState);\n    }');
}
if (!source.includes('registerPlugin(SanabilDownloadsPlugin.class)')) throw new Error('Could not register SanabilDownloadsPlugin in MainActivity');
fs.writeFileSync(main, source);
console.log('Installed Sanabil native Downloads plugin in Android project.');
