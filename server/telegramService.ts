import { TradeSignal, MarketOutlookDigest } from '../src/types.js';

export class TelegramService {
  private botToken: string;
  private chatId: string;
  private isEnabled: boolean;
  private discordWebhookUrl: string;
  private discordEnabled: boolean;

  constructor(botToken = '', chatId = '', isEnabled = false, discordWebhookUrl = '', discordEnabled = false) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = chatId || process.env.TELEGRAM_CHAT_ID || '';
    this.isEnabled = isEnabled || !!(this.botToken && this.chatId);
    this.discordWebhookUrl = discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL || '';
    this.discordEnabled = discordEnabled || !!this.discordWebhookUrl;
  }

  public updateCredentials(
    botToken: string, 
    chatId: string, 
    isEnabled: boolean, 
    discordWebhookUrl = '', 
    discordEnabled = false
  ) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.isEnabled = isEnabled;
    this.discordWebhookUrl = discordWebhookUrl;
    this.discordEnabled = discordEnabled;
  }

  public isConfigured(): boolean {
    return Boolean(this.botToken && this.chatId);
  }

  public isDiscordConfigured(): boolean {
    return Boolean(this.discordWebhookUrl);
  }

  // Get Telegram Bot Profile Info
  public async getBotMe(): Promise<{ success: boolean; bot?: any; error?: string }> {
    if (!this.botToken) {
      return { success: false, error: 'Telegram bot token is not configured.' };
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`);
      const data = await res.json() as any;
      if (data.ok) {
        return { success: true, bot: data.result };
      }
      return { success: false, error: data.description || 'Failed to fetch bot info' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // Configure the Telegram Bot Menu Button to open this Mini App directly
  public async setChatMenuButton(webAppUrl: string): Promise<{ success: boolean; error?: string }> {
    if (!this.botToken) {
      return { success: false, error: 'Telegram bot token is not configured.' };
    }
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/setChatMenuButton`;
      const payload = {
        menu_button: {
          type: 'web_app',
          text: '📊 Market Radar',
          web_app: {
            url: webAppUrl
          }
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json() as any;
      if (data.ok) {
        return { success: true };
      }
      return { success: false, error: data.description || 'Failed to set chat menu button' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // Send raw Telegram message with robust error recovery for channels, groups, and private chats
  public async sendRawMessage(
    text: string, 
    parseMode: 'Markdown' | 'HTML' = 'Markdown',
    inlineKeyboard?: Array<Array<{ text: string; url?: string; callback_data?: string; web_app?: { url: string } }>>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.botToken || !this.chatId) {
      return { success: false, error: 'Telegram bot token or chat ID is not configured.' };
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const bodyPayload: any = {
        chat_id: this.chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      };

      if (inlineKeyboard && inlineKeyboard.length > 0) {
        bodyPayload.reply_markup = {
          inline_keyboard: inlineKeyboard
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json() as { ok: boolean; result?: { message_id: number }; description?: string };
      if (data.ok) {
        return { success: true, messageId: String(data.result?.message_id) };
      } else {
        const errorDesc = data.description || '';
        console.warn('Telegram API initial dispatch returned error:', errorDesc);

        // Recovery Tier 1: If error is due to BUTTON_TYPE_INVALID or reply_markup (common in channels/supergroups),
        // convert all web_app buttons to standard url buttons and retry.
        if (
          errorDesc.includes('BUTTON_TYPE_INVALID') || 
          errorDesc.includes('reply_markup') || 
          errorDesc.includes('BUTTON_URL_INVALID') ||
          errorDesc.includes('BUTTON_DATA_INVALID')
        ) {
          console.log('Sanitizing inline keyboard for Telegram channel/group compatibility and retrying...');
          const sanitizedKeyboard = inlineKeyboard?.map(row => 
            row.map(btn => {
              if (btn.web_app && btn.web_app.url) {
                return { text: btn.text, url: btn.web_app.url };
              }
              if (btn.url) {
                return { text: btn.text, url: btn.url };
              }
              // If callback_data was rejected in a channel, convert to informational link or drop callback
              return { text: btn.text, url: 'https://ai.studio/build' };
            })
          ).filter(row => row.length > 0);

          const sanitizedPayload = {
            ...bodyPayload,
            reply_markup: sanitizedKeyboard && sanitizedKeyboard.length > 0 ? { inline_keyboard: sanitizedKeyboard } : undefined
          };

          const retryBtnRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sanitizedPayload),
          });
          const retryBtnData = await retryBtnRes.json() as any;
          if (retryBtnData.ok) {
            return { success: true, messageId: String(retryBtnData.result?.message_id) };
          }

          // Recovery Tier 2: If still failing with buttons, dispatch text-only without reply_markup
          console.warn('Button dispatch still rejected, attempting text-only delivery fallback...');
          const textOnlyPayload = {
            chat_id: this.chatId,
            text,
            parse_mode: parseMode,
            disable_web_page_preview: true,
          };
          const textOnlyRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(textOnlyPayload),
          });
          const textOnlyData = await textOnlyRes.json() as any;
          if (textOnlyData.ok) {
            return { success: true, messageId: String(textOnlyData.result?.message_id) };
          }
        }

        // Recovery Tier 3: If Markdown parsing failed, retry without markdown formatting
        if (parseMode && errorDesc.includes('entity')) {
          console.warn('Telegram Markdown parse error, retrying with raw text fallback:', errorDesc);
          const fallbackPayload = {
            chat_id: this.chatId,
            text: text.replace(/[*_`#]/g, ''),
            disable_web_page_preview: true,
          };
          const retryRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fallbackPayload),
          });
          const retryData = await retryRes.json() as any;
          if (retryData.ok) {
            return { success: true, messageId: String(retryData.result?.message_id) };
          }
        }

        return { success: false, error: data.description || 'Failed to send message to Telegram' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Telegram network request failed' };
    }
  }

  // Send Discord Webhook Message
  public async sendDiscordAlert(title: string, description: string, fields: Array<{ name: string; value: string; inline?: boolean }>, color = 0x10b981): Promise<{ success: boolean; error?: string }> {
    if (!this.discordWebhookUrl) {
      return { success: false, error: 'Discord webhook URL is not configured.' };
    }

    try {
      const payload = {
        embeds: [
          {
            title,
            description,
            color,
            fields,
            footer: { text: 'Market Radar Bot v3.2 • Real-Time Engine' },
            timestamp: new Date().toISOString(),
          }
        ]
      };

      const response = await fetch(this.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok || response.status === 204) {
        return { success: true };
      } else {
        const errorText = await response.text();
        return { success: false, error: errorText || 'Discord webhook request failed' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Discord request failed' };
    }
  }

  public async sendSignalAlert(signal: TradeSignal, appUrl = ''): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // 🛡️ Strict Asset Governance: Never dispatch alerts for indices (macro barometers only)
    const indicesSymbols = ['DXY', 'US10Y', 'VIX', 'US30', 'US100', 'US500', 'GER40', 'UK100', 'JPN225'];
    if (indicesSymbols.includes(signal.symbol.toUpperCase())) {
      return { success: false, error: 'المؤشرات مخصصة لتحليل قوة وسرد العملات والأسواق الكلية فقط ولا يتم إرسال صفقات عليها.' };
    }

    const isLong = signal.direction === 'LONG';
    const dirEmoji = isLong ? '🟢 📈 *شراء (LONG BUY)*' : '🔴 📉 *بيع (SHORT SELL)*';
    const confidenceStars = '⭐'.repeat(Math.round(signal.confidence / 20));
    const tradeTypeBadge = signal.tradeType === 'DAILY_SWING' || signal.tradeType === 'SWING'
      ? '🌊 *صفقة سوينق يومي (DAILY SWING)*' 
      : '⚡ *مضاربة سريعة (SCALP SNIPER)*';
    
    let message = `🎯 *إشارة رادار التداول الذكي | RADAR SIGNAL*\n\n`;
    message += `*الرمز (Asset):* \`${signal.symbol}\`  •  *الفريم (TF):* \`${signal.timeframe}\`\n`;
    message += `*نوع الصفقة (Type):* ${tradeTypeBadge}\n`;
    if (signal.tradeTypeExplanation) {
      message += `*التصنيف:* _${signal.tradeTypeExplanation}_\n`;
    }
    message += `*الاتجاه (Action):* ${dirEmoji}\n`;
    message += `*النموذج الفني:* *${signal.pattern.name}*\n`;
    message += `*نسبة الثقة:* \`${signal.confidence}%\` (${confidenceStars})\n`;
    message += `*العائد للمخاطرة (R:R):* \`1:${signal.riskRewardRatio.toFixed(2)}\`  •  *التوافق:* \`${signal.confluenceScore}%\`\n\n`;

    if (signal.timeframeCascade) {
      message += `🌊 *نظام تتابع الفريمات (Multi-Timeframe Cascade):*\n`;
      message += `• *التوافق:* \`${signal.timeframeCascade.cascadeAlignmentScore}%\` (${signal.timeframeCascade.alignmentStatus})\n`;
      message += `• *الاتجاه الكلي (${signal.timeframeCascade.htf.timeframe.toUpperCase()}):* \`${signal.timeframeCascade.htf.bias}\` (${signal.timeframeCascade.htf.structure})\n`;
      message += `• *هيكل السيولة (${signal.timeframeCascade.itf.timeframe.toUpperCase()}):* \`${signal.timeframeCascade.itf.structureShift}\`\n`;
      message += `• *تأكيد الدخول (${signal.timeframeCascade.ltf.timeframe.toUpperCase()}):* \`${signal.timeframeCascade.ltf.trigger}\`\n`;
      message += `• *الخلاصة:* ${signal.timeframeCascade.cascadeSummaryArabic}\n\n`;
    }
    
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📍 *سعر الدخول (Entry):* \`${signal.entryPrice}\`\n`;
    message += `🛑 *وقف الخسارة (Stop Loss):* \`${signal.stopLoss}\`\n`;
    message += `🎯 *الهدف الأول (TP1):* \`${signal.takeProfit1}\`\n`;
    message += `🎯 *الهدف الثاني (TP2):* \`${signal.takeProfit2}\`\n`;
    message += `🎯 *الهدف الثالث (TP3):* \`${signal.takeProfit3}\`\n`;
    if (signal.targetHoldingHorizon) {
      message += `⏱️ *المدى الزمني:* \`${signal.targetHoldingHorizon}\`\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (signal.confluenceFactors && signal.confluenceFactors.length > 0) {
      message += `⚡ *أسباب التوافق الفني (Confluences):*\n`;
      signal.confluenceFactors.forEach(factor => {
        message += `• ${factor}\n`;
      });
      message += `\n`;
    }

    if (signal.aiAnalysis) {
      message += `🧠 *خطة الذكاء الاصطناعي (AI Next Move):*\n`;
      message += `• *التوجه:* \`${signal.aiAnalysis.marketBias}\`\n`;
      message += `• *الملخص:* ${signal.aiAnalysis.summary}\n`;
      message += `• *شرط الإلغاء:* ${signal.aiAnalysis.invalidationTrigger}\n`;
      message += `• *أفق الحركة:* ${signal.aiAnalysis.expectedMoveTimeframe}\n`;
      if (signal.aiAnalysis.fearGreedConfluence) {
        message += `• *معنويات السوق:* ${signal.aiAnalysis.fearGreedConfluence}\n`;
      }
      message += `\n`;
    }

    message += `🛡️ _نظام حماية منع التضارب والوقف المتحرك (ATR Trailing) مفعل_`;

    // Add interactive Telegram buttons (Universal standard URL buttons compatible with channels, groups, and DMs)
    const inlineKeyboard: Array<Array<{ text: string; url?: string; callback_data?: string; web_app?: { url: string } }>> = [];
    
    // Primary row: Open in Telegram Mini App / Web App directly
    const validAppUrl = appUrl && appUrl.startsWith('http') 
      ? `${appUrl}?tab=chart&symbol=${encodeURIComponent(signal.symbol)}`
      : 'https://ai.studio/build';

    inlineKeyboard.push([
      { 
        text: `📱 Open ${signal.symbol} in Market Radar`, 
        url: validAppUrl
      }
    ]);

    // Secondary row: Quick actions (Using URL links for 100% channel compatibility)
    const baseApp = appUrl && appUrl.startsWith('http') ? appUrl : 'https://ai.studio/build';
    inlineKeyboard.push([
      { text: `⚡ Execute Paper Trade`, url: `${baseApp}?tab=paper` },
      { text: `🧠 AI Intelligence`, url: `${baseApp}?tab=ai` }
    ]);

    const tgResult = await this.sendRawMessage(message, 'Markdown', inlineKeyboard);

    // Also dispatch to Discord if configured
    if (this.discordEnabled && this.discordWebhookUrl) {
      const color = signal.direction === 'LONG' ? 0x10b981 : 0xef4444;
      await this.sendDiscordAlert(
        `🎯 ${signal.symbol} - ${signal.direction} Signal (${signal.confidence}%)`,
        `**Pattern:** ${signal.pattern.name}\n${signal.pattern.description}`,
        [
          { name: '📍 Entry Price', value: `${signal.entryPrice}`, inline: true },
          { name: '🛑 Stop Loss', value: `${signal.stopLoss}`, inline: true },
          { name: '🎯 TP1 / TP2', value: `${signal.takeProfit1} / ${signal.takeProfit2}`, inline: true },
          { name: '⚡ Risk/Reward', value: `1:${signal.riskRewardRatio.toFixed(2)}`, inline: true },
          { name: '⭐ Confidence', value: `${signal.confidence}%`, inline: true },
          { name: '🧠 AI Summary', value: signal.aiAnalysis?.summary || 'Standard Multi-Timeframe Scan', inline: false },
        ],
        color
      );
    }

    return tgResult;
  }

  public async sendTestMessage(appUrl = ''): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const text = `🚀 *MARKET RADAR BOT TELEGRAM CONNECTED!*\n\n` +
      `✅ Bot Token & Chat ID verified successfully.\n` +
      `📡 Real-time trade signals, AI trade setups, trailing stop alerts, and daily market reports will be dispatched here.\n\n` +
      `📱 *Telegram Mini App Ready:* You can launch the full Market Radar interface directly inside Telegram using the button below.\n\n` +
      `⏱️ *Time:* \`${new Date().toISOString()}\`\n` +
      `🤖 *Status:* *ACTIVE & READY WITH MINI APP SUPPORT*`;
    
    const inlineKeyboard: Array<Array<{ text: string; url?: string; callback_data?: string; web_app?: { url: string } }>> = [];
    
    const validUrl = appUrl && appUrl.startsWith('http') ? appUrl : 'https://ai.studio/build';
    inlineKeyboard.push([
      { text: '📱 Open Market Radar Mini App', url: validUrl }
    ]);

    inlineKeyboard.push([
      { text: '⚡ Bot Status: 100% OK', url: `${validUrl}?tab=settings` }
    ]);

    return this.sendRawMessage(text, 'Markdown', inlineKeyboard);
  }

  public async sendDailyDigest(digest: MarketOutlookDigest): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let message = `📊 *DAILY MARKET RADAR OUTLOOK & MACRO DIGEST*\n\n`;
    message += `🌐 *Overall Sentiment:* \`${digest.overallSentiment}\``;
    if (digest.fearGreedIndex !== undefined) {
      message += `  •  *Fear & Greed:* \`${digest.fearGreedIndex}/100\` (${digest.fearGreedSentiment || ''})\n\n`;
    } else {
      message += `\n\n`;
    }

    message += `📝 *Executive Summary:*\n${digest.executiveSummary}\n\n`;
    
    message += `🔥 *Top High-Conviction Opportunities:*\n`;
    digest.topOpportunities.forEach((opp, i) => {
      const icon = opp.direction === 'LONG' ? '🟢' : '🔴';
      message += `${i + 1}. ${icon} *${opp.symbol}* (${opp.direction}) - _${opp.conviction}_\n   ${opp.reason}\n`;
    });
    message += `\n`;

    if (digest.macroFactors?.length) {
      message += `⚡ *Key Macro Drivers:*\n`;
      digest.macroFactors.forEach(f => message += `• ${f}\n`);
      message += `\n`;
    }

    if (digest.upcomingEventsSummary?.length) {
      message += `📅 *Upcoming High-Impact News:*\n`;
      digest.upcomingEventsSummary.forEach(ev => message += `• ${ev}\n`);
      message += `\n`;
    }

    if (digest.riskWarnings?.length) {
      message += `⚠️ *Risk Warnings & Trailing Protections:*\n`;
      digest.riskWarnings.forEach(w => message += `• ${w}\n`);
    }

    return this.sendRawMessage(message, 'Markdown');
  }

  // Send Trade Opening Notification
  public async sendTradeOpenAlert(trade: any, appUrl = ''): Promise<void> {
    const isLong = trade.direction === 'LONG';
    const icon = isLong ? '🟢 📈 *تم تفعيل صفقة شراء (LONG BUY)*' : '🔴 📉 *تم تفعيل صفقة بيع (SHORT SELL)*';
    let text = `⚡ *صفقة جديدة بالبوت الآلي | NEW BOT POSITION*\n\n`;
    text += `${icon}\n`;
    text += `*الأصل:* \`${trade.symbol}\`  •  *اللوت:* \`${trade.lotSize || 0.02}\`\n`;
    text += `📍 *الدخول:* \`${trade.entryPrice}\`\n`;
    text += `🛑 *وقف الخسارة:* \`${trade.stopLoss}\`\n`;
    text += `🎯 *الهدف TP1:* \`${trade.takeProfit1}\`\n`;
    if (trade.takeProfit2) text += `🎯 *الهدف TP2:* \`${trade.takeProfit2}\`\n`;
    text += `\n🛡️ _تدار الصفقة ذاتياً 24/7 عبر خادم Cloud Daemon مع الوقف المتحرك_`;

    const inlineKeyboard = [
      [{ text: '📱 عرض الصفقات المباشرة', url: appUrl ? `${appUrl}?tab=paper` : 'https://ai.studio/build' }]
    ];
    await this.sendRawMessage(text, 'Markdown', inlineKeyboard);
  }

  // Send Trade Closed Notification (TP/SL/Trailing SL)
  public async sendTradeCloseAlert(trade: any, appUrl = ''): Promise<void> {
    const isProfit = (trade.pnl || 0) >= 0;
    const statusEmoji = isProfit ? '🎉 💰 *إغلاق بربح محقق (PROFIT LOCKED)*' : '🛑 ⚠️ *إغلاق بوقف الخسارة (STOP LOSS)*';
    let text = `🔔 *تقرير إغلاق صفقة | POSITION CLOSED*\n\n`;
    text += `${statusEmoji}\n`;
    text += `*الرمز:* \`${trade.symbol}\` (${trade.direction})\n`;
    text += `*سبب الإغلاق:* \`${trade.closeReason || 'TARGET_HIT'}\`\n`;
    text += `💵 *الربح / الخسارة:* \`${trade.pnl > 0 ? '+' : ''}$${(trade.pnl || 0).toFixed(2)}\` (\`${(trade.pnlPercentage || 0).toFixed(2)}%\`)\n`;
    text += `📍 *سعر الخروج:* \`${trade.currentPrice}\`\n`;
    text += `\n📊 _رأس المال يتم تحديثه تلقائياً في السيرفر السحابي المستمر_`;

    await this.sendRawMessage(text, 'Markdown');
  }

  // Send Multi-TP Partial Close Notification
  public async sendPartialCloseAlert(trade: any, partialLots: number, partialPnL: number, breakEvenSl: number, appUrl = ''): Promise<void> {
    let text = `🎯 *تأمين أرباح وإغلاق جزئي | MULTI-TP PARTIAL CLOSE*\n\n`;
    text += `🎉 *تم تحقيق الهدف الأول (TP1) بنجاح على ${trade.symbol}!* (${trade.direction})\n\n`;
    text += `💰 *الربح المحقق المحجوز:* \`+$${partialPnL.toFixed(2)}\` (إغلاق 50% = \`${partialLots}\` لوت)\n`;
    text += `🛡️ *حماية نقطة الدخول (Break-Even):* تم رفع الوقف تلقائياً إلى \`${breakEvenSl}\` بضمان صفر مخاطرة.\n`;
    text += `🚀 *الكمية المتبقية:* \`${trade.lotSize}\` لوت تستمر مجاناً باتجاه الهدف الثاني (TP2: \`${trade.takeProfit2}\`) والثالث!\n\n`;
    text += `⚡ _نظام الإدارة الذاتية لرأس المال وحماية الصفقات_`;

    const inlineKeyboard = [
      [{ text: '📱 متابعة الصفقة المباشرة', url: appUrl ? `${appUrl}?tab=paper` : 'https://ai.studio/build' }]
    ];
    await this.sendRawMessage(text, 'Markdown', inlineKeyboard);
  }

  // Send High-Impact News Shield Alert
  public async sendNewsShieldAlert(symbol: string, eventTitle: string, minutes: number, appUrl = ''): Promise<void> {
    let text = `🛡️ *تفعيل درع الأخبار عالي التأثير | NEWS SHIELD ACTIVATED*\n\n`;
    text += `⚠️ *تم تعليق فتح الصفقات الجديدة تلقائياً على ${symbol}*\n`;
    text += `📅 *البيان الاقتصادي:* *${eventTitle}*\n`;
    text += `⏱️ *الوقت المتبقي:* \`${minutes > 0 ? `بعد ${minutes} دقيقة` : `قبل قليل (تقلبات عالية)`}\`\n\n`;
    text += `🔒 _الدرع يحمي حسابك من الانزلاقات السعرية (Slippage) واتساع السبريد المفاجئ أثناء المؤتمرات والبيانات الكبرى._`;

    await this.sendRawMessage(text, 'Markdown');
  }

  // --- Interactive Remote Control Engine ---
  private isPollingActive = false;
  private lastUpdateId = 0;

  public startPolling(radarEngineRef: any) {
    if (this.isPollingActive || !this.botToken) return;
    this.isPollingActive = true;
    console.log('🤖 Telegram Remote Control Polling Loop Started for 24/7 Autonomous Control.');

    const poll = async () => {
      if (!this.isPollingActive) return;
      try {
        if (this.botToken) {
          const res = await fetch(`https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=20`);
          const data = await res.json() as any;
          if (data && data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
              this.lastUpdateId = update.update_id;
              await this.handleIncomingUpdate(update, radarEngineRef);
            }
          }
        }
      } catch (err) {
        // Silent backoff on transient errors
      }
      if (this.isPollingActive) {
        setTimeout(poll, 3000);
      }
    };

    poll();
  }

  public stopPolling() {
    this.isPollingActive = false;
  }

  // Handle incoming Telegram message from user
  public async handleIncomingUpdate(update: any, radarEngineRef: any): Promise<void> {
    const msg = update.message || update.edited_message;
    if (!msg || !msg.text) return;

    const chatId = String(msg.chat.id);
    const text = msg.text.trim();
    const command = text.split(' ')[0].toLowerCase();

    const reply = async (replyText: string, keyboard?: any) => {
      try {
        await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            parse_mode: 'Markdown',
            reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined
          })
        });
      } catch (e) {
        console.error('Failed to reply to Telegram command:', e);
      }
    };

    // Commands router
    if (command === '/start' || command === '/help' || command === 'مساعدة' || command === 'الأوامر') {
      const helpText = `🤖 *مرحباً بك في مركز التحكم عن بُعد لبوت التداول السحابي 24/7*\n\n` +
        `يمكنك التحكم بالبوت ومتابعة الصفقات بالكامل دون الحاجة للبقاء في الصفحة:\n\n` +
        `📊 */status* - حالة البوت اللحظية، السيرفر السحابي، والصفقات المفتوحة\n` +
        `📈 */trades* - عرض الصفقات المفتوحة مع الأرباح/الخسائر الحالية\n` +
        `⚡ */scan* - إجراء مسح فوري شامل لجميع الأزواج وإرسال أفضل الفرص\n` +
        `💰 */balance* - رصيد المحفظة وهدف المضاعفة $50 -> $500\n` +
        `⏸️ */pause* - إيقاف البوت مؤقتاً عن فتح صفقات جديدة\n` +
        `▶️ */resume* - إعادة تشغيل واستئناف البوت الآلي\n` +
        `🚨 */closeall* - إغلاق فوري لجميع الصفقات المفتوحة لحماية الأرباح\n\n` +
        `🛡️ _البوت يعمل على مدار الساعة في السحابة حتى لو أغلقت جهازك أو انقطع النت._`;
      await reply(helpText);
    } 
    else if (command === '/status' || command === 'الحالة') {
      const status = radarEngineRef.getStatus();
      const openTrades = radarEngineRef.getPaperTrades().filter((t: any) => t.status === 'OPEN');
      const totalFloatingPnl = openTrades.reduce((acc: number, t: any) => acc + (t.pnl || 0), 0);
      
      const statusEmoji = status.isRunning ? '🟢 *نشط ويعمل 24/7*' : '⏸️ *متوقف مؤقتاً*';
      let statText = `📊 *تقرير حالة خادم البوت السحابي (Cloud Daemon)*\n\n`;
      statText += `• *حالة المحرك:* ${statusEmoji}\n`;
      statText += `• *الصفقات المفتوحة:* \`${openTrades.length}\` صفقة\n`;
      statText += `• *الربح العائم الحسابي:* \`${totalFloatingPnl >= 0 ? '+' : ''}$${totalFloatingPnl.toFixed(2)}\`\n`;
      statText += `• *رأس المال الحالي:* \`$${(status.accountBalance || 50).toFixed(2)}\`\n`;
      statText += `• *آخر فحص للسوق:* \`${new Date(status.lastScanTime || Date.now()).toLocaleTimeString()}\`\n`;
      statText += `• *عدد الأصول المراقبة:* \`${radarEngineRef.getSymbols().length} زوج وأصل عالمي\`\n\n`;
      statText += `💡 _أرسل /trades لعرض الصفقات المفتوحة بالتفصيل_`;
      await reply(statText);
    } 
    else if (command === '/trades' || command === '/open' || command === 'الصفقات') {
      const openTrades = radarEngineRef.getPaperTrades().filter((t: any) => t.status === 'OPEN');
      if (openTrades.length === 0) {
        await reply(`ℹ️ *لا توجد صفقات مفتوحة حالياً.* المحرك يبحث باستمرار عن فرص ذات توافق عالي.`);
        return;
      }

      let trText = `📈 *الصفقات المفتوحة حالياً (${openTrades.length}):*\n\n`;
      openTrades.forEach((t: any, idx: number) => {
        const isLong = t.direction === 'LONG';
        const pnlIcon = (t.pnl || 0) >= 0 ? '🟢' : '🔴';
        trText += `${idx + 1}. ${isLong ? '🟢 BUY' : '🔴 SELL'} *${t.symbol}* (${t.lotSize || 0.02} Lot)\n`;
        trText += `   📍 دخول: \`${t.entryPrice}\` | سعر حالي: \`${t.currentPrice}\`\n`;
        trText += `   🛑 SL: \`${t.stopLoss}\` | 🎯 TP1: \`${t.takeProfit1}\`\n`;
        trText += `   ${pnlIcon} الربح: \`${t.pnl >= 0 ? '+' : ''}$${(t.pnl || 0).toFixed(2)}\` (${(t.pnlPercentage || 0).toFixed(2)}%)\n\n`;
      });
      await reply(trText);
    } 
    else if (command === '/scan' || command === '/hunt' || command === 'فحص') {
      await reply(`🔍 *جارٍ فحص ومسح الأسواق الشامل عبر Gemini AI...* يرجى الانتظار ثوانٍ معدودة.`);
      try {
        const scanRes = await radarEngineRef.executeMarketScan();
        const signals = radarEngineRef.getSignals().slice(0, 3);
        
        let resMsg = `⚡ *اكتمل الفحص الشامل بنجاح!* تم فحص \`${scanRes.scannedSymbolsCount}\` أصل مالي.\n\n`;
        if (signals.length > 0) {
          resMsg += `🔥 *أفضل الفرص المرصودة الآن:*\n`;
          signals.forEach((s: any, idx: number) => {
            resMsg += `${idx + 1}. *${s.symbol}* (${s.direction}) - ثقة \`${s.confidence}%\` (R:R \`1:${s.riskRewardRatio?.toFixed(2) || '2.0'}\`)\n`;
          });
        } else {
          resMsg += `ℹ️ *السوق في حالة سيولة متوازنة، يفضل الانتظار.*`;
        }
        await reply(resMsg);
      } catch (err: any) {
        await reply(`❌ فشل الفحص: ${err.message}`);
      }
    } 
    else if (command === '/pause' || command === 'ايقاف') {
      radarEngineRef.toggleBot(false);
      await reply(`⏸️ *تم إيقاف البوت مؤقتاً بنجاح.* لن يفتح صفقات جديدة حتى ترسل /resume.`);
    } 
    else if (command === '/resume' || command === '/run' || command === 'تشغيل') {
      radarEngineRef.toggleBot(true);
      await reply(`▶️ *تم استئناف وتشغيل البوت الآلي 24/7 بنجاح!* الخادم الآن يراقب ويفحص الصفقات.`);
    } 
    else if (command === '/balance' || command === 'الرصيد') {
      const status = radarEngineRef.getStatus();
      const openTrades = radarEngineRef.getPaperTrades().filter((t: any) => t.status === 'OPEN');
      const floating = openTrades.reduce((acc: number, t: any) => acc + (t.pnl || 0), 0);
      const equity = (status.accountBalance || 50) + floating;
      const target = 500;
      const progress = Math.min(100, Math.max(0, ((equity - 50) / (target - 50)) * 100));

      let balText = `💰 *تقرير المحفظة والنمو التراكمي (10x Goal)*\n\n`;
      balText += `• *الرصيد المحقق (Balance):* \`$${(status.accountBalance || 50).toFixed(2)}\`\n`;
      balText += `• *السيولة العائمة (Equity):* \`$${equity.toFixed(2)}\`\n`;
      balText += `• *هدف المضاعفة (Target):* \`$${target}.00\` ($50 -> $500)\n`;
      balText += `• *نسبة التقدم نحو الهدف:* \`${progress.toFixed(1)}%\` 🚀\n`;
      await reply(balText);
    } 
    else if (command === '/closeall' || command === 'اغلاق_الكل') {
      const openTrades = radarEngineRef.getPaperTrades().filter((t: any) => t.status === 'OPEN');
      if (openTrades.length === 0) {
        await reply(`ℹ️ لا توجد أي صفقات مفتوحة لإغلاقها.`);
        return;
      }
      openTrades.forEach((t: any) => {
        radarEngineRef.closePaperTrade(t.id, 'MANUAL');
      });
      await reply(`🚨 *تم إغلاق جميع الصفقات المفتوحة (${openTrades.length}) بنجاح وتأمين الرصيد.*`);
    }
  }
}

export const telegramService = new TelegramService();

