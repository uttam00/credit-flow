import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/sequelize';

export type CurrencyModule = 'CAMPAIGN' | 'REPORT' | 'DISCOVERY';

export interface CurrencyPlan {
  credits: number;
  priceInPaise: number;
}

export class Currency extends Model<InferAttributes<Currency>, InferCreationAttributes<Currency>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare module: CurrencyModule;
  declare priceInPaise: number;
  declare plans: CurrencyPlan[];
  declare createdAt: CreationOptional<Date>;
}

Currency.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    module: {
      type: DataTypes.ENUM('CAMPAIGN', 'REPORT', 'DISCOVERY'),
      allowNull: false,
    },
    priceInPaise: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    plans: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'currencies',
    modelName: 'Currency',
    underscored: true,
    updatedAt: false,
  },
);
