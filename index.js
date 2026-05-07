const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 🔑 TOKEN da Render Environment Variables
const TOKEN = process.env.DISCORD_TOKEN;

const CHANNEL_ID = "1501900366424313977";
const STATUS_URL = "https://a2.asurahosting.com:6370/status-json.xsl";

let messageId = null;
let lastSong = null;

// 📡 STREAM DATA
async function getStreamData() {
  try {
    const res = await axios.get(STATUS_URL);

    const source = res.data?.icestats?.source;
    const stream = Array.isArray(source) ? source[0] : source;

    return {
      live: !!stream,
      title: stream?.title || "One Dance Radio - Live",
      listeners: stream?.listeners || 0
    };

  } catch (err) {
    return {
      live: false,
      title: "One Dance Radio - Live",
      listeners: 0
    };
  }
}

// 🎨 EMBED
function buildEmbed(data) {
  return {
    color: data.live ? 0xe60000 : 0x2f3136,

    title: data.live
      ? "🔴 ONE DANCE RADIO – LIVE"
      : "⚫ ONE DANCE RADIO – OFF AIR",

    description: data.live
      ? `🎧 **NOW PLAYING**\n>>> **${data.title}**\n\n📡 Streaming attivo 24/7`
      : `📡 La radio è momentaneamente offline`,

    thumbnail: {
      url: "https://a2.asurahosting.com:6370/favicon.ico"
    },

    fields: data.live
      ? [
          {
            name: "🎵 Ascolta ora",
            value: "[Apri Player](https://www.onedanceradio.com/ascolta-one-dance-radio2/)"
          },
          {
            name: "👥 Ascoltatori live",
            value: `**${data.listeners}**`
          }
        ]
      : [],

    image: {
      url: "https://www.onedanceradio.com/wp-content/uploads/2025/07/cropped-Logo-One-Dance-Radio-trasp.png"
    },

    footer: {
      text: "One Dance Radio • Live Broadcast System"
    },

    timestamp: new Date()
  };
}

// 🔄 UPDATE BOT
async function update(channel) {
  const data = await getStreamData();
  const embed = buildEmbed(data);

  try {

    // 🎧 PARLA SOLO SE CAMBIA BRANO
    if (data.live && data.title !== lastSong) {
      lastSong = data.title;

      await channel.send(`🎧 Now Playing: **${data.title}**`);
    }

    // 📌 EMBED FISSO
    if (!messageId) {
      const msg = await channel.send({ embeds: [embed] });
      messageId = msg.id;
    } else {
      const msg = await channel.messages.fetch(messageId);
      await msg.edit({ embeds: [embed] });
    }

  } catch (err) {
    console.error("Errore update:", err);
    messageId = null;
  }
}

// 🤖 READY
client.once("ready", async () => {
  console.log(`Bot online come ${client.user.tag}`);
  console.log("TOKEN LETTO:", process.env.DISCORD_TOKEN ? "OK" : "MANCANTE");

  const channel = await client.channels.fetch(CHANNEL_ID);

  await update(channel);

  setInterval(() => {
    update(channel);
  }, 15000);
});

// 🔑 LOGIN
client.login(TOKEN).catch(console.error);