const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1501900366424313977";
const STATUS_URL = "https://a2.asurahosting.com:6370/status-json.xsl";

let messageId = null;

// 🎧 prende il brano live da Icecast
async function getNowPlaying() {
  try {
    const res = await axios.get(STATUS_URL);

    const source = res.data.icestats.source;
    const stream = Array.isArray(source) ? source[0] : source;

    return stream.title || "One Dance Radio - Live";
  } catch (err) {
    return "One Dance Radio - Live";
  }
}

async function getStreamStatus() {
  try {
    const res = await axios.get(STATUS_URL);

    const source = res.data.icestats.source;
    const stream = Array.isArray(source) ? source[0] : source;

    return stream ? true : false;
  } catch {
    return false;
  }
}

// 🎨 messaggio embed PRO
async function update(channel) {
  const song = await getNowPlaying();
  const isLive = await getStreamStatus();
  const listeners = await getListeners();

  const embed = {
    color: isLive ? 0xe60000 : 0x2f3136,

    title: isLive
      ? "🔴 ONE DANCE RADIO – LIVE"
      : "⚫ ONE DANCE RADIO – OFF AIR",

    description: isLive
      ? `🎧 **NOW PLAYING**\n>>> **${song}**\n\n📡 Streaming attivo 24/7`
      : `📡 La radio è momentaneamente offline`,

    thumbnail: {
      url: "https://a2.asurahosting.com:6370/favicon.ico"
    },

    fields: isLive
      ? [
          {
            name: "🎵 Apri il player",
          value: "[Clicca qui](https://www.onedanceradio.com/ascolta-one-dance-radio2/)"
          },
          {
            name: "👥 Ascoltatori live",
            value: `**${listeners}** persone stanno ascoltando`
          }
        ]
      : [],

    image: {
      url: "https://i.imgur.com/0X0X0X0.jpg" 
      // 🔴 puoi sostituire con logo/banner tuo dopo
    },

    footer: {
      text: "One Dance Radio • Live Broadcast System"
    },

    timestamp: new Date()
  };

  try {
    if (!messageId) {
      const msg = await channel.send({ embeds: [embed] });
      messageId = msg.id;
    } else {
      const msg = await channel.messages.fetch(messageId);
      msg.edit({ embeds: [embed] });
    }
  } catch (err) {
    console.error("Errore update:", err);
  }
}

async function getListeners() {
  try {
    const res = await axios.get(STATUS_URL);

    const source = res.data.icestats.source;
    const stream = Array.isArray(source) ? source[0] : source;

    return stream.listeners || 0;
  } catch {
    return 0;
  }
}

// 🤖 avvio bot
client.on("clientReady", async () => {
  console.log(`Bot online come ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);

  await update(channel);

  setInterval(() => {
    update(channel);
  }, 15000);
});

// 🔑 login
client.login(TOKEN).catch(console.error);