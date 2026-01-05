import { LoggerLevel } from './Utils';
import { EngineLogger } from './Logger';

export * as Utils from './Utils';
export * as Style from './Style';

EngineLogger.setLevel(LoggerLevel.Debug);

EngineLogger.log('普通日志');
EngineLogger.warn('警告信息');
EngineLogger.error('错误信息');
EngineLogger.debug('调试信息');

EngineLogger.time('operation');
// 执行某些操作
EngineLogger.timeEnd('operation'); // 输出操作耗时
