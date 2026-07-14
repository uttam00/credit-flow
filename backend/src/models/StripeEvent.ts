import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/sequelize';

export class StripeEvent extends Model<
  InferAttributes<StripeEvent>,
  InferCreationAttributes<StripeEvent>
> {
  declare id: CreationOptional<number>;
  declare stripeEventId: string;
  declare userId: CreationOptional<number | null>;
  declare eventType: string;
  declare data: Record<string, unknown>;
  declare processed: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
}

StripeEvent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    stripeEventId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    eventType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
      // See Currency.plans: MariaDB's JSON columns come back as a raw
      // string, not auto-parsed like on MySQL 8.
      get(this: StripeEvent): Record<string, unknown> {
        const raw = this.getDataValue('data');
        return typeof raw === 'string' ? (JSON.parse(raw) as Record<string, unknown>) : raw;
      },
    },
    processed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'stripe_events',
    modelName: 'StripeEvent',
    underscored: true,
    updatedAt: false,
  },
);
