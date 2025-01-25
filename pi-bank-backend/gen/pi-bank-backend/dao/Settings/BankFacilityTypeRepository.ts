import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface BankFacilityTypeEntity {
    readonly Id: number;
    Name?: string;
}

export interface BankFacilityTypeCreateEntity {
    readonly Name?: string;
}

export interface BankFacilityTypeUpdateEntity extends BankFacilityTypeCreateEntity {
    readonly Id: number;
}

export interface BankFacilityTypeEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
        };
        contains?: {
            Id?: number;
            Name?: string;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
        };
    },
    $select?: (keyof BankFacilityTypeEntity)[],
    $sort?: string | (keyof BankFacilityTypeEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface BankFacilityTypeEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<BankFacilityTypeEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface BankFacilityTypeUpdateEntityEvent extends BankFacilityTypeEntityEvent {
    readonly previousEntity: BankFacilityTypeEntity;
}

export class BankFacilityTypeRepository {

    private static readonly DEFINITION = {
        table: "BANKFACILITYTYPE",
        properties: [
            {
                name: "Id",
                column: "BANKFACILITYTYPE_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "BANKFACILITYTYPE_NAME",
                type: "VARCHAR",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(BankFacilityTypeRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: BankFacilityTypeEntityOptions): BankFacilityTypeEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): BankFacilityTypeEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: BankFacilityTypeCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "BANKFACILITYTYPE",
            entity: entity,
            key: {
                name: "Id",
                column: "BANKFACILITYTYPE_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: BankFacilityTypeUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "BANKFACILITYTYPE",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "BANKFACILITYTYPE_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: BankFacilityTypeCreateEntity | BankFacilityTypeUpdateEntity): number {
        const id = (entity as BankFacilityTypeUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as BankFacilityTypeUpdateEntity);
            return id;
        } else {
            return this.create(entity);
        }
    }

    public deleteById(id: number): void {
        const entity = this.dao.find(id);
        this.dao.remove(id);
        this.triggerEvent({
            operation: "delete",
            table: "BANKFACILITYTYPE",
            entity: entity,
            key: {
                name: "Id",
                column: "BANKFACILITYTYPE_ID",
                value: id
            }
        });
    }

    public count(options?: BankFacilityTypeEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "BANKFACILITYTYPE"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: BankFacilityTypeEntityEvent | BankFacilityTypeUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("pi-bank-backend-Settings-BankFacilityType", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("pi-bank-backend-Settings-BankFacilityType").send(JSON.stringify(data));
    }
}
