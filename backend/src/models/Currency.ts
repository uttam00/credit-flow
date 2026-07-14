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
      // MariaDB's JSON type is a LONGTEXT alias under a CHECK(JSON_VALID())
      // constraint, not a native JSON type like MySQL 8's — mysql2 doesn't
      // know to auto-parse it, so it comes back as a raw JSON string. Real
      // MySQL 8 already returns a parsed value here, so guard on typeof
      // rather than assuming either behavior.
      get(this: Currency): CurrencyPlan[] {
        const raw = this.getDataValue('plans');
        return typeof raw === 'string' ? (JSON.parse(raw) as CurrencyPlan[]) : raw;
      },
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
