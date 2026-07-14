import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/sequelize';

export class WalletBalance extends Model<
  InferAttributes<WalletBalance>,
  InferCreationAttributes<WalletBalance>
> {
  declare userId: number;
  declare currencyId: number;
  declare balanceInCredits: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

WalletBalance.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    currencyId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    balanceInCredits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'wallet_balances',
    modelName: 'WalletBalance',
    underscored: true,
  },
);
