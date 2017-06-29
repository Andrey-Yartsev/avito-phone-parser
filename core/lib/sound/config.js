const Path = require('path');
const staticFolder = Path.join(__dirname, '../../static');

module.exports = {
  soundsFolder: Path.join(staticFolder, '/sound'),
  asterFolder: Path.join(__dirname, '../../../asterisk/sound')
}
