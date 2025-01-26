import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface BankFacilityEntity {
    readonly Id: number;
    Name?: string;
    Latitude?: number;
    Longitude?: number;
    Type?: number;
    Status?: number;
}

export interface BankFacilityCreateEntity {
    readonly Name?: string;
    readonly Latitude?: number;
    readonly Longitude?: number;
    readonly Type?: number;
    readonly Status?: number;
}

export interface BankFacilityUpdateEntity extends BankFacilityCreateEntity {
    readonly Id: number;
}

export interface BankFacilityEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
            Latitude?: number | number[];
            Longitude?: number | number[];
            Type?: number | number[];
            Status?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
            Latitude?: number | number[];
            Longitude?: number | number[];
            Type?: number | number[];
            Status?: number | number[];
        };
        contains?: {
            Id?: number;
            Name?: string;
            Latitude?: number;
            Longitude?: number;
            Type?: number;
            Status?: number;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
            Latitude?: number;
            Longitude?: number;
            Type?: number;
            Status?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
            Latitude?: number;
            Longitude?: number;
            Type?: number;
            Status?: number;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
            Latitude?: number;
            Longitude?: number;
            Type?: number;
            Status?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
            Latitude?: number;
            Longitude?: number;
            Type?: number;
            Status?: number;
        };
    },
    $select?: (keyof BankFacilityEntity)[],
    $sort?: string | (keyof BankFacilityEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface BankFacilityEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<BankFacilityEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface BankFacilityUpdateEntityEvent extends BankFacilityEntityEvent {
    readonly previousEntity: BankFacilityEntity;
}

export class BankFacilityRepository {

    private static readonly DEFINITION = {
        table: "BANKFACILITY",
        properties: [
            {
                name: "Id",
                column: "BANKFACILITIES_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "BANKFACILITY_NAME",
                type: "VARCHAR",
            },
            {
                name: "Latitude",
                column: "BANKFACILITIES_LATITUDE",
                type: "DOUBLE",
            },
            {
                name: "Longitude",
                column: "BANKFACILITY_LONGITUDE",
                type: "DOUBLE",
            },
            {
                name: "Type",
                column: "BANKFACILITY_BANKFACILITYTYPE",
                type: "INTEGER",
            },
            {
                name: "Status",
                column: "BANKFACILITY_BANKFACILITYSTATUS",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(BankFacilityRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: BankFacilityEntityOptions): BankFacilityEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): BankFacilityEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: BankFacilityCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "BANKFACILITY",
            entity: entity,
            key: {
                name: "Id",
                column: "BANKFACILITIES_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: BankFacilityUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "BANKFACILITY",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "BANKFACILITIES_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: BankFacilityCreateEntity | BankFacilityUpdateEntity): number {
        const id = (entity as BankFacilityUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as BankFacilityUpdateEntity);
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
            table: "BANKFACILITY",
            entity: entity,
            key: {
                name: "Id",
                column: "BANKFACILITIES_ID",
                value: id
            }
        });
    }

    public count(options?: BankFacilityEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "BANKFACILITY"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: BankFacilityEntityEvent | BankFacilityUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("pi-bank-backend-bankFacility-BankFacility", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("pi-bank-backend-bankFacility-BankFacility").send(JSON.stringify(data));
    }
}
