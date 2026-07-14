import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/sequelize';

export type LedgerReason = 'PURCHASE' | 'CAMPAIGN_SPEND';

export class Ledger extends Model<InferAttributes<Ledger>, InferCreationAttributes<Ledger>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare currencyId: number;
  declare amountInCredits: number;
  declare reason: LedgerReason;
  declare paymentId: CreationOptional<string | null>;
  declare campaignId: CreationOptional<number | null>;
  declare createdAt: CreationOptional<Date>;
}

Ledger.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    currencyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amountInCredits: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.ENUM('PURCHASE', 'CAMPAIGN_SPEND'),
      allowNull: false,
    },
    paymentId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    campaignId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'ledger',
    modelName: 'Ledger',
    underscored: true,
    updatedAt: false,
  },
);
