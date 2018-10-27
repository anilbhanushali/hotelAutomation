const CONFIG = {
    maxConsumption:{
        floor:40,
        hotel:65
    },
    light: {
        unitsConsumed: 5,
        defaultState: {
            'main': true,
            'sub': false
        }
    },
    ac: {
        unitsConsumed: 10,
        defaultState: {
            'main': true,
            'sub': true
        }
    }
}

class Hotel {
    constructor({ floors, mainCorridors, subCorridors, optimizationType } = {}) {
        this._optimizationType = optimizationType;
        this._createFloors(floors);
        this._createCorridors('main', mainCorridors);
        this._createCorridors('sub', subCorridors);
    }

    _createFloors(floors) {
        this._floors = new Array(floors);
    }

    _createCorridors(corridorType, count) {
        for (var i = 0; i < this._floors.length; i++) {
            if (this._floors[i] === undefined) {
                this._floors[i] = [];
            }
            for (let index = 0; index < count; index++) {
                let corridor = new Corridor({
                    type: corridorType,
                    lights: 1,
                    ac: 1
                });
                this._floors[i] = [...this._floors[i], corridor]
            }
        }
    }

    _getFloors() {
        return this._floors;
    }

    _getCorridors(floor = 1, type) {
        return this._floors[floor - 1].filter((corridor, index) => {
            return type ? corridor._type == type : true;
        })
    }

    getMaximumPowerConsumption() {
        const floors = this._getFloors().length;
        const mainCorridors = this._getCorridors(1, 'main').length;
        const subCorridors = this._getCorridors(1, 'sub').length;
        if(this._optimizationType == "floor"){
            return CONFIG.maxConsumption[this._optimizationType];
        }
        return ((mainCorridors * 15) + (subCorridors * 10)) * floors;
    }

    getUnitsConsumed(floorNumber) {
        let floors = [...this._floors];
        
        if(floorNumber){
            floors = [this._floors[floorNumber-1]];
        }

        return floors.reduce((totalUnits, corridors) => {
            const totalFloorUnit = corridors.reduce((totalUnits, corridor) => {
                const totalEquipments = corridor.getEquipments()
                    .filter((equipment) => {
                        return equipment.isOn();
                    })
                    .reduce((totalUnits, equipment) => {
                        return totalUnits + equipment.unitsConsumed();
                    }, 0);
                return totalUnits + totalEquipments;
            }, 0)
            return totalUnits + totalFloorUnit;
        }, 0)
    }

    motionDetected({ motion, floor, corridor, corridorType }) {
        //switch on the lights where the motion is detected.
        const activeCorridor = this._getCorridors(floor, corridorType)[corridor - 1];
        const controlledEquiptmentsInCorridor = activeCorridor.getEquipments().filter(e => e.isControlled() && e.isOn() == false);

        if (motion) {
            controlledEquiptmentsInCorridor.forEach(e => {
                e.switchOn();
            });
        } else {
            const corridors = this._getCorridors(floor);
            corridors.forEach(c => {
                const controlledEquiptmentsInCorridor = c.getEquipments().filter(e => e.isControlled());
                controlledEquiptmentsInCorridor.forEach(e => {
                    const defaultOn = CONFIG[e._type]['defaultState'][corridorType];
                    if (!defaultOn) {
                        e.switchOff()
                    } else {
                        e.switchOn()
                    }
                });
            })
        }
        // check the totalConsumption with maxConsumption
        // savethePower if required 🔥
        if(this.powerConsumptionExceeded(floor)){
            this.savePowerOnFloor(floor,corridor);
        }
        
    }

    powerConsumptionExceeded(floor){

        if(this._optimizationType == "floor"){
            return this.getUnitsConsumed(floor) > this.getMaximumPowerConsumption();
        }else{
            return this.getUnitsConsumed() > this.getMaximumPowerConsumption();
        }
    }

    savePowerOnFloor(floor,corridorWithActivity){
        const corridors = this._getCorridors(floor);
        const inActiveCorridors = corridors.filter((c,i)=>i!=corridorWithActivity);
        inActiveCorridors.forEach(c=>{
            const controlledEquiptmentsInCorridor = c.getEquipments().filter(e => e.isControlled() && e.isOn());
            controlledEquiptmentsInCorridor.forEach(e=>{
                e.switchOff();
            })
        })
    }

    getEquipmentStatus() {
        const result = {};
        this._getFloors().forEach((f,fi)=>{
            const floorKey = `floor_${fi+1}`;
            result[floorKey]={};
            
            const main = f.filter(c=>c._type=='main');
            const sub = f.filter(c=>c._type=='sub');
            addCorridorsToStatus(main);
            addCorridorsToStatus(sub);
            function addCorridorsToStatus(corridors){
                corridors.forEach((c,ci)=>{
                    const corridorKey = `${c._type}Corridor_${ci+1}`;
                    result[floorKey][corridorKey]={};
                    const equipments = c.getEquipments();
                    equipments.forEach((e,ei)=>{
                        const equipmentKey = `${e._type}`;
                        result[floorKey][corridorKey][equipmentKey] = e.isOn()?'ON':'OFF';
                    });
                });
            }
        })
        return result;
    }
}

class Equipment {
    constructor({ type, isControlled, isSwitchedOn, unitsConsumed }) {
        this._type = type;
        this._isControlled = isControlled;
        this._isSwitchedOn = isSwitchedOn;
        this._unitsConsumed = unitsConsumed;
    }
    unitsConsumed() {
        return this._unitsConsumed;
    }
    switchOn() {
        this._isSwitchedOn = true;
    }
    switchOff() {
        this._isSwitchedOn = false;
    }
    isOn() {
        return this._isSwitchedOn;
    }
    isControlled() {
        return this._isControlled;
    }
}

class Corridor {
    constructor({ type, lights = 0, ac = 0 }) {
        //main or sub
        this._type = type;
        this._equipments = [];
        this._initEquipments('light', lights);
        this._initEquipments('ac', ac);
    }

    _initEquipments(equipmentType, count) {
        for (let index = 0; index < count; index++) {
            this._equipments = [...this._equipments, new Equipment({
                type: equipmentType,
                isControlled: this._type === 'main' ? false : true,
                isSwitchedOn: CONFIG[equipmentType]['defaultState'][this._type],
                unitsConsumed: CONFIG[equipmentType]['unitsConsumed']
            })]
        }
    }

    getEquipments() {
        return this._equipments;
    }
}

module.exports = {
    Hotel: Hotel,
    Corridor: Corridor
};