import { User } from './User';
import { Currency } from './Currency';
import { WalletBalance } from './WalletBalance';
import { Ledger } from './Ledger';
import { Campaign } from './Campaign';
import { StripeEvent } from './StripeEvent';

User.hasMany(WalletBalance, { foreignKey: 'userId' });
WalletBalance.belongsTo(User, { foreignKey: 'userId' });

Currency.hasMany(WalletBalance, { foreignKey: 'currencyId' });
WalletBalance.belongsTo(Currency, { foreignKey: 'currencyId' });

User.hasMany(Ledger, { foreignKey: 'userId' });
Ledger.belongsTo(User, { foreignKey: 'userId' });

Currency.hasMany(Ledger, { foreignKey: 'currencyId' });
Ledger.belongsTo(Currency, { foreignKey: 'currencyId' });

Campaign.hasMany(Ledger, { foreignKey: 'campaignId' });
Ledger.belongsTo(Campaign, { foreignKey: 'campaignId' });

User.hasMany(Campaign, { foreignKey: 'userId' });
Campaign.belongsTo(User, { foreignKey: 'userId' });

Currency.hasMany(Campaign, { foreignKey: 'currencyId' });
Campaign.belongsTo(Currency, { foreignKey: 'currencyId' });

User.hasMany(StripeEvent, { foreignKey: 'userId' });
StripeEvent.belongsTo(User, { foreignKey: 'userId' });

export { User, Currency, WalletBalance, Ledger, Campaign, StripeEvent };
